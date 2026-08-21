import { and, asc, desc, eq, or } from "drizzle-orm";

import { extractDecisionCandidates } from "@/ai";
import type { AIProvider } from "@/ai/provider";
import { db as defaultDb, type AppDb } from "@/db";
import { trySyncKnowledgeEmbedding } from "@/db/queries/embeddings";
import { assertProductOwnership } from "@/db/queries/products";
import {
  contextPackItems,
  contextPacks,
  decisionCaptureCandidates,
  features,
  knowledgeEvents,
  knowledgeItems,
  knowledgeRelationships,
  knowledgeSources,
  knowledgeTaskLinks,
  modules,
  products,
  sources,
  taskOutcomes,
  tasks,
} from "@/db/schema/index";
import {
  buildTaskOutcomeSourceContent,
  decisionCandidateEvidenceIncludesSource,
  decisionCandidateToVerifiedKnowledgeInput,
  formatDecisionCandidateRelationships,
  type DecisionCandidateReviewEdits,
  type TaskOutcomeInput,
} from "@/lib/decision-capture/model";
import { getLifecycleEventType } from "@/lib/product-memory/knowledge-model";

export async function createTaskOutcomeForReview(
  productId: string,
  contextPackId: string,
  input: TaskOutcomeInput,
  userId: string,
  provider?: AIProvider,
  db: AppDb = defaultDb,
) {
  const detail = await getContextPackRecord(productId, contextPackId, userId, db);

  if (!detail) {
    throw new Error("Context Pack not found or not accessible.");
  }

  await assertOutcomeScope(productId, input.moduleId, input.featureId, db);

  const sourceContent = buildTaskOutcomeSourceContent(input);
  const [source] = await db
    .insert(sources)
    .values({
      productId,
      moduleId: input.moduleId,
      featureId: input.featureId,
      sourceType: "task_outcome",
      name: `Task outcome: ${detail.task.title} (${Date.now()})`,
      rawContent: sourceContent,
      metadata: {
        taskId: detail.task.id,
        contextPackId,
        outcomeKind: "task_outcome",
      },
      createdBy: userId,
    })
    .returning();

  const [outcome] = await db
    .insert(taskOutcomes)
    .values({
      productId,
      taskId: detail.task.id,
      contextPackId,
      moduleId: input.moduleId,
      featureId: input.featureId,
      sourceId: source.id,
      summary: input.summary,
      finalDecisionNotes: input.finalDecisionNotes,
      references: input.references,
      pastedOutcome: input.pastedOutcome,
      status: "created",
      createdBy: userId,
    })
    .returning();

  try {
    const existingKnowledge = await getExistingKnowledgeForDecisionCapture(
      productId,
      contextPackId,
      input.moduleId,
      input.featureId,
      db,
    );
    const extraction = await extractDecisionCandidates(
      {
        product: {
          id: detail.product.id,
          name: detail.product.name,
          description: detail.product.description,
        },
        task: {
          id: detail.task.id,
          title: detail.task.title,
          description: detail.task.description,
        },
        contextPack: {
          id: detail.pack.id,
          version: detail.pack.version,
          generatedContent: detail.pack.generatedContent,
        },
        outcome: {
          id: outcome.id,
          sourceId: source.id,
          summary: outcome.summary,
          finalDecisionNotes: outcome.finalDecisionNotes,
          references: outcome.references,
          pastedOutcome: outcome.pastedOutcome,
          moduleId: outcome.moduleId,
          featureId: outcome.featureId,
        },
        existingKnowledge: existingKnowledge.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          knowledgeType: item.knowledgeType,
          authority: item.authority,
          lifecycleStatus: item.lifecycleStatus,
        })),
      },
      provider,
    );

    if (extraction.candidates.length) {
      await db.insert(decisionCaptureCandidates).values(
        extraction.candidates.map((candidate) => ({
          outcomeId: outcome.id,
          productId,
          taskId: detail.task.id,
          contextPackId,
          sourceId: source.id,
          moduleId: input.moduleId,
          featureId: input.featureId,
          title: candidate.title,
          body: candidate.body,
          knowledgeType: candidate.knowledgeType,
          suggestedAuthority: candidate.suggestedAuthority,
          confidence: candidate.confidence,
          reasoningSummary: candidate.reasoningSummary,
          sourceEvidence: candidate.sourceEvidence,
          potentialRelationships: [
            ...candidate.potentialRelationships,
            ...formatDecisionCandidateRelationships(candidate),
          ],
          possibleConflicts: candidate.possibleConflicts,
          status: "pending" as const,
        })),
      );
    }

    const [updated] = await db
      .update(taskOutcomes)
      .set({ status: "extracted", updatedAt: new Date() })
      .where(eq(taskOutcomes.id, outcome.id))
      .returning();

    return updated;
  } catch (error) {
    const [failed] = await db
      .update(taskOutcomes)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "AI extraction failed.",
        updatedAt: new Date(),
      })
      .where(eq(taskOutcomes.id, outcome.id))
      .returning();

    return failed;
  }
}

export async function getTaskOutcomeReview(
  productId: string,
  contextPackId: string,
  outcomeId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const detail = await getContextPackRecord(productId, contextPackId, userId, db);

  if (!detail) {
    return null;
  }

  const [outcome] = await db
    .select()
    .from(taskOutcomes)
    .where(
      and(
        eq(taskOutcomes.id, outcomeId),
        eq(taskOutcomes.productId, productId),
        eq(taskOutcomes.contextPackId, contextPackId),
      ),
    )
    .limit(1);

  if (!outcome) {
    return null;
  }

  const [source] = outcome.sourceId
    ? await db
        .select()
        .from(sources)
        .where(
          and(
            eq(sources.id, outcome.sourceId),
            eq(sources.productId, productId),
          ),
        )
        .limit(1)
    : [null];
  const candidates = await db
    .select()
    .from(decisionCaptureCandidates)
    .where(eq(decisionCaptureCandidates.outcomeId, outcome.id))
    .orderBy(asc(decisionCaptureCandidates.createdAt));
  const existingKnowledge = await getExistingKnowledgeForDecisionCapture(
    productId,
    contextPackId,
    outcome.moduleId,
    outcome.featureId,
    db,
  );

  return {
    ...detail,
    outcome,
    source,
    candidates,
    existingKnowledge,
  };
}

export async function getRecentTaskOutcomesForContextPack(
  productId: string,
  contextPackId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(taskOutcomes)
    .where(
      and(
        eq(taskOutcomes.productId, productId),
        eq(taskOutcomes.contextPackId, contextPackId),
      ),
    )
    .orderBy(desc(taskOutcomes.createdAt))
    .limit(5);
}

export async function approveDecisionCaptureCandidate(
  productId: string,
  contextPackId: string,
  outcomeId: string,
  candidateId: string,
  edits: DecisionCandidateReviewEdits,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const candidate = await getPendingDecisionCandidate(
    productId,
    contextPackId,
    outcomeId,
    candidateId,
    db,
  );

  if (!candidate) {
    throw new Error("Decision candidate is not pending or is not accessible.");
  }

  if (!decisionCandidateEvidenceIncludesSource(edits, candidate.sourceId)) {
    throw new Error("Approved knowledge must preserve task outcome source evidence.");
  }

  if (edits.relatedKnowledgeId) {
    await assertKnowledgeBelongsToProduct(productId, edits.relatedKnowledgeId, db);
  }

  const [knowledge] = await db
    .insert(knowledgeItems)
    .values({
      ...decisionCandidateToVerifiedKnowledgeInput(candidate, edits),
      createdBy: userId,
    })
    .returning();

  await db.insert(knowledgeSources).values({
    knowledgeItemId: knowledge.id,
    sourceId: candidate.sourceId,
  }).onConflictDoNothing();

  await db.insert(knowledgeTaskLinks).values({
    knowledgeItemId: knowledge.id,
    taskId: candidate.taskId,
    productId,
    contextPackId,
    outcomeId,
    linkType: "captured_from_outcome",
    createdBy: userId,
  }).onConflictDoNothing();

  await db.insert(knowledgeEvents).values({
    productId,
    featureId: candidate.featureId,
    knowledgeItemId: knowledge.id,
    eventType: getLifecycleEventType(knowledge.knowledgeType, "verified"),
    toLifecycleStatus: "verified",
    title: knowledge.title,
    note: `Captured from task outcome. Reasoning: ${edits.reasoningSummary}`,
    createdBy: userId,
  });

  if (edits.relatedKnowledgeId) {
    await db.insert(knowledgeRelationships).values({
      productId,
      fromKnowledgeId: knowledge.id,
      toKnowledgeId: edits.relatedKnowledgeId,
      relationshipType: edits.relationshipType,
      reason: edits.relationshipReason || "Linked during task outcome review.",
      createdBy: userId,
    }).onConflictDoNothing();
  }

  await db
    .update(decisionCaptureCandidates)
    .set({
      title: edits.title,
      body: edits.body,
      knowledgeType: edits.knowledgeType,
      suggestedAuthority: edits.authority,
      confidence: edits.confidence,
      reasoningSummary: edits.reasoningSummary,
      sourceEvidence: edits.sourceEvidence,
      potentialRelationships: edits.potentialRelationships,
      possibleConflicts: edits.possibleConflicts,
      status: "approved",
      approvedKnowledgeItemId: knowledge.id,
      updatedAt: new Date(),
    })
    .where(eq(decisionCaptureCandidates.id, candidateId));

  await trySyncKnowledgeEmbedding(knowledge.id, productId, userId, db);

  return knowledge;
}

export async function rejectDecisionCaptureCandidate(
  productId: string,
  contextPackId: string,
  outcomeId: string,
  candidateId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .update(decisionCaptureCandidates)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(decisionCaptureCandidates.id, candidateId),
        eq(decisionCaptureCandidates.productId, productId),
        eq(decisionCaptureCandidates.contextPackId, contextPackId),
        eq(decisionCaptureCandidates.outcomeId, outcomeId),
        eq(decisionCaptureCandidates.status, "pending"),
      ),
    )
    .returning();

  return rows[0] ?? null;
}

async function getContextPackRecord(
  productId: string,
  contextPackId: string,
  userId: string,
  db: AppDb,
) {
  await assertProductOwnership(productId, userId, db);

  const [detail] = await db
    .select({
      product: products,
      pack: contextPacks,
      task: tasks,
    })
    .from(contextPacks)
    .innerJoin(products, eq(contextPacks.productId, products.id))
    .innerJoin(tasks, eq(contextPacks.taskId, tasks.id))
    .where(
      and(
        eq(contextPacks.id, contextPackId),
        eq(contextPacks.productId, productId),
      ),
    )
    .limit(1);

  return detail ?? null;
}

async function getExistingKnowledgeForDecisionCapture(
  productId: string,
  contextPackId: string,
  moduleId: string | null,
  featureId: string | null,
  db: AppDb,
) {
  const includedRows = await db
    .select({ knowledgeItem: knowledgeItems })
    .from(contextPackItems)
    .innerJoin(
      knowledgeItems,
      eq(contextPackItems.knowledgeItemId, knowledgeItems.id),
    )
    .where(eq(contextPackItems.contextPackId, contextPackId));
  const scopeConditions = [eq(knowledgeItems.productId, productId)];

  if (moduleId) {
    scopeConditions.push(eq(knowledgeItems.moduleId, moduleId));
  }

  if (featureId) {
    scopeConditions.push(eq(knowledgeItems.featureId, featureId));
  }

  const scopedRows =
    scopeConditions.length > 1
      ? await db
          .select()
          .from(knowledgeItems)
          .where(and(eq(knowledgeItems.productId, productId), or(...scopeConditions.slice(1))))
      : [];
  const deduped = new Map<string, typeof knowledgeItems.$inferSelect>();

  for (const row of includedRows) {
    deduped.set(row.knowledgeItem.id, row.knowledgeItem);
  }

  for (const item of scopedRows) {
    deduped.set(item.id, item);
  }

  return Array.from(deduped.values());
}

async function getPendingDecisionCandidate(
  productId: string,
  contextPackId: string,
  outcomeId: string,
  candidateId: string,
  db: AppDb,
) {
  const rows = await db
    .select()
    .from(decisionCaptureCandidates)
    .where(
      and(
        eq(decisionCaptureCandidates.id, candidateId),
        eq(decisionCaptureCandidates.productId, productId),
        eq(decisionCaptureCandidates.contextPackId, contextPackId),
        eq(decisionCaptureCandidates.outcomeId, outcomeId),
        eq(decisionCaptureCandidates.status, "pending"),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

async function assertOutcomeScope(
  productId: string,
  moduleId: string | null,
  featureId: string | null,
  db: AppDb,
) {
  if (moduleId) {
    const [module] = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(eq(modules.id, moduleId), eq(modules.productId, productId)))
      .limit(1);

    if (!module) {
      throw new Error("Affected module is not accessible for this product.");
    }
  }

  if (featureId) {
    const [feature] = await db
      .select({ id: features.id, moduleId: features.moduleId })
      .from(features)
      .where(and(eq(features.id, featureId), eq(features.productId, productId)))
      .limit(1);

    if (!feature) {
      throw new Error("Affected feature is not accessible for this product.");
    }

    if (moduleId && feature.moduleId !== moduleId) {
      throw new Error("Affected feature must belong to the selected module.");
    }
  }
}

async function assertKnowledgeBelongsToProduct(
  productId: string,
  knowledgeItemId: string,
  db: AppDb,
) {
  const rows = await db
    .select({ id: knowledgeItems.id })
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.id, knowledgeItemId),
        eq(knowledgeItems.productId, productId),
      ),
    )
    .limit(1);

  if (!rows.length) {
    throw new Error("Related knowledge is not accessible for this product.");
  }
}
