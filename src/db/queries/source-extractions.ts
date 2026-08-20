import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";

import { extractProductKnowledge } from "@/ai";
import type { AIProvider } from "@/ai/provider";
import type { ExistingFeatureContext } from "@/ai/prompts/product-knowledge-extraction";
import { db as defaultDb, type AppDb } from "@/db";
import { getFeatureKnowledge } from "@/db/queries/features";
import { getSourceDetail } from "@/db/queries/sources";
import { assertProductOwnership } from "@/db/queries/products";
import {
  knowledgeEvents,
  knowledgeConflicts,
  knowledgeRelationships,
  knowledgeItems,
  knowledgeSources,
  featureRelationships,
  sourceExtractionCandidates,
  sourceExtractions,
} from "@/db/schema/index";
import {
  detectKnowledgeConflicts,
} from "@/lib/product-memory/conflict-detection";
import { getLifecycleEventType } from "@/lib/product-memory/knowledge-model";
import {
  candidateEvidenceIncludesSource,
  candidateToVerifiedKnowledgeInput,
  type CandidateReviewEdits,
} from "@/lib/source-ingestion/review-model";

export async function createSourceExtractionForReview(
  productId: string,
  sourceId: string,
  userId: string,
  provider?: AIProvider,
  db: AppDb = defaultDb,
) {
  const detail = await getSourceDetail(productId, sourceId, userId, db);

  if (!detail) {
    throw new Error("Source not found or not accessible.");
  }

  const existingFeatureContext = await buildExistingFeatureContext(
    productId,
    userId,
    detail,
    db,
  );
  const extraction = await extractProductKnowledge(
    detail.extractionInput,
    existingFeatureContext,
    provider,
  );

  const [run] = await db
    .insert(sourceExtractions)
    .values({
      productId,
      sourceId,
      status: "ready",
      skippedClaims: extraction.skippedClaims,
      createdBy: userId,
    })
    .returning();

  if (extraction.candidates.length) {
    const candidates = await db.insert(sourceExtractionCandidates).values(
      extraction.candidates.map((candidate) => ({
        extractionId: run.id,
        productId,
        sourceId,
        moduleId: detail.source.moduleId,
        featureId: detail.source.featureId,
        title: candidate.title,
        body: candidate.body,
        knowledgeType: candidate.knowledgeType,
        suggestedAuthority: candidate.suggestedAuthority,
        confidence: candidate.confidence,
        reasoningSummary: candidate.reasoningSummary,
        sourceEvidence: candidate.sourceEvidence,
        potentialRelationships: candidate.potentialRelationships,
        appearsHistorical: candidate.appearsHistorical,
        possibleConflicts: candidate.possibleConflicts,
        status: "pending" as const,
      })),
    ).returning();
    const existingKnowledge = await getVerifiedKnowledgeForConflictScope(
      productId,
      detail.source.moduleId,
      detail.source.featureId,
      db,
    );

    const conflicts = candidates.flatMap((candidate) =>
      detectKnowledgeConflicts(candidate, existingKnowledge).map((conflict) => ({
        productId,
        extractionId: run.id,
        candidateId: candidate.id,
        existingKnowledgeItemId: conflict.existingKnowledgeItemId,
        conflictType: conflict.conflictType,
        summary: conflict.summary,
        existingSnapshot: existingKnowledgeSnapshot(
          existingKnowledge.find((item) => item.id === conflict.existingKnowledgeItemId),
        ),
        candidateSnapshot: candidateSnapshot(candidate),
        metadata: conflict.metadata,
      })),
    );

    if (conflicts.length) {
      await db.insert(knowledgeConflicts).values(conflicts);
    }
  }

  return run;
}

export async function getSourceExtractionReview(
  productId: string,
  sourceId: string,
  extractionId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const detail = await getSourceDetail(productId, sourceId, userId, db);

  if (!detail) {
    return null;
  }

  const [extraction] = await db
    .select()
    .from(sourceExtractions)
    .where(
      and(
        eq(sourceExtractions.id, extractionId),
        eq(sourceExtractions.productId, productId),
        eq(sourceExtractions.sourceId, sourceId),
      ),
    )
    .limit(1);

  if (!extraction) {
    return null;
  }

  const candidates = await db
    .select()
    .from(sourceExtractionCandidates)
    .where(eq(sourceExtractionCandidates.extractionId, extractionId))
    .orderBy(asc(sourceExtractionCandidates.createdAt));
  const conflicts = await db
    .select()
    .from(knowledgeConflicts)
    .where(eq(knowledgeConflicts.extractionId, extractionId))
    .orderBy(asc(knowledgeConflicts.createdAt));

  return {
    ...detail,
    extraction,
    candidates,
    conflicts,
  };
}

export async function getRecentSourceExtractions(
  productId: string,
  sourceId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(sourceExtractions)
    .where(
      and(
        eq(sourceExtractions.productId, productId),
        eq(sourceExtractions.sourceId, sourceId),
      ),
    )
    .orderBy(desc(sourceExtractions.createdAt))
    .limit(5);
}

export async function approveExtractionCandidate(
  productId: string,
  sourceId: string,
  extractionId: string,
  candidateId: string,
  edits: CandidateReviewEdits,
  userId: string,
  db: AppDb = defaultDb,
) {
  return approveExtractionCandidateInternal(
    productId,
    sourceId,
    extractionId,
    candidateId,
    edits,
    userId,
    db,
    false,
  );
}

async function approveExtractionCandidateAllowingConflict(
  productId: string,
  sourceId: string,
  extractionId: string,
  candidateId: string,
  edits: CandidateReviewEdits,
  userId: string,
  db: AppDb,
) {
  return approveExtractionCandidateInternal(
    productId,
    sourceId,
    extractionId,
    candidateId,
    edits,
    userId,
    db,
    true,
  );
}

async function approveExtractionCandidateInternal(
  productId: string,
  sourceId: string,
  extractionId: string,
  candidateId: string,
  edits: CandidateReviewEdits,
  userId: string,
  db: AppDb,
  allowPendingConflicts: boolean,
) {
  await assertProductOwnership(productId, userId, db);

  if (!candidateEvidenceIncludesSource(edits, sourceId)) {
    throw new Error("Approved knowledge must preserve source evidence.");
  }

  const candidate = await getPendingCandidate(
    productId,
    sourceId,
    extractionId,
    candidateId,
    db,
  );

  if (!candidate) {
    throw new Error("Candidate is not pending or is not accessible.");
  }

  if (!allowPendingConflicts) {
    await assertNoPendingConflicts(candidate.id, db);
  }

  const [knowledge] = await db
    .insert(knowledgeItems)
    .values({
      ...candidateToVerifiedKnowledgeInput(candidate, edits),
      createdBy: userId,
    })
    .returning();

  await db.insert(knowledgeSources).values({
    knowledgeItemId: knowledge.id,
    sourceId,
  }).onConflictDoNothing();

  await db.insert(knowledgeEvents).values({
    productId,
    featureId: candidate.featureId,
    knowledgeItemId: knowledge.id,
    eventType: getLifecycleEventType(knowledge.knowledgeType, "verified"),
    toLifecycleStatus: "verified",
    title: knowledge.title,
    note: `Approved from AI extraction candidate. Reasoning: ${edits.reasoningSummary}`,
    createdBy: userId,
  });

  await db
    .update(sourceExtractionCandidates)
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
    .where(eq(sourceExtractionCandidates.id, candidateId));

  return knowledge;
}

export async function resolveExtractionConflict(
  productId: string,
  sourceId: string,
  extractionId: string,
  conflictId: string,
  resolution: "replace_existing" | "keep_both" | "mark_existing_outdated" | "reject_new",
  edits: CandidateReviewEdits,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const [conflict] = await db
    .select()
    .from(knowledgeConflicts)
    .where(
      and(
        eq(knowledgeConflicts.id, conflictId),
        eq(knowledgeConflicts.productId, productId),
        eq(knowledgeConflicts.extractionId, extractionId),
        eq(knowledgeConflicts.resolution, "pending"),
      ),
    )
    .limit(1);

  if (!conflict) {
    throw new Error("Conflict is not pending or is not accessible.");
  }

  let approvedKnowledgeId: string | null = null;
  if (resolution === "reject_new") {
    await rejectExtractionCandidate(
      productId,
      sourceId,
      extractionId,
      conflict.candidateId,
      userId,
      db,
    );
  } else {
    if (resolution === "replace_existing" || resolution === "mark_existing_outdated") {
      await markKnowledgeOutdated(
        productId,
        conflict.existingKnowledgeItemId,
        userId,
        db,
      );
    }

    const approved = await approveExtractionCandidateAllowingConflict(
      productId,
      sourceId,
      extractionId,
      conflict.candidateId,
      edits,
      userId,
      db,
    );
    approvedKnowledgeId = approved.id;

    await db.insert(knowledgeRelationships).values({
      fromKnowledgeId: approved.id,
      toKnowledgeId: conflict.existingKnowledgeItemId,
      relationshipType:
        resolution === "keep_both" ? "kept_alongside_conflict" : "supersedes",
    }).onConflictDoNothing();
  }

  const now = new Date();
  await db
    .update(knowledgeConflicts)
    .set({
      resolution,
      resolvedBy: userId,
      resolvedAt: now,
      updatedAt: now,
      metadata: {
        ...conflict.metadata,
        approvedKnowledgeId,
      },
    })
    .where(eq(knowledgeConflicts.id, conflict.id));
}

export async function approveAllPendingExtractionCandidates(
  productId: string,
  sourceId: string,
  extractionId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const candidates = await getPendingCandidates(
    productId,
    sourceId,
    extractionId,
    userId,
    db,
  );
  const pendingConflictRows = await db
    .select({ candidateId: knowledgeConflicts.candidateId })
    .from(knowledgeConflicts)
    .where(
      and(
        eq(knowledgeConflicts.extractionId, extractionId),
        eq(knowledgeConflicts.resolution, "pending"),
      ),
    );
  const blockedCandidateIds = new Set(
    pendingConflictRows.map((row) => row.candidateId),
  );

  const approved = [];
  for (const candidate of candidates.filter(
    (item) => !blockedCandidateIds.has(item.id),
  )) {
    approved.push(
      await approveExtractionCandidate(
        productId,
        sourceId,
        extractionId,
        candidate.id,
        {
          title: candidate.title,
          body: candidate.body,
          knowledgeType: candidate.knowledgeType,
          authority: candidate.suggestedAuthority,
          confidence: candidate.confidence,
          reasoningSummary: candidate.reasoningSummary,
          sourceEvidence: candidate.sourceEvidence,
          potentialRelationships: candidate.potentialRelationships,
          possibleConflicts: candidate.possibleConflicts,
        },
        userId,
        db,
      ),
    );
  }

  return approved;
}

export async function rejectExtractionCandidate(
  productId: string,
  sourceId: string,
  extractionId: string,
  candidateId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .update(sourceExtractionCandidates)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sourceExtractionCandidates.id, candidateId),
        eq(sourceExtractionCandidates.productId, productId),
        eq(sourceExtractionCandidates.sourceId, sourceId),
        eq(sourceExtractionCandidates.extractionId, extractionId),
        eq(sourceExtractionCandidates.status, "pending"),
      ),
    )
    .returning();

  return rows[0] ?? null;
}

async function getPendingCandidates(
  productId: string,
  sourceId: string,
  extractionId: string,
  userId: string,
  db: AppDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(sourceExtractionCandidates)
    .where(
      and(
        eq(sourceExtractionCandidates.productId, productId),
        eq(sourceExtractionCandidates.sourceId, sourceId),
        eq(sourceExtractionCandidates.extractionId, extractionId),
        eq(sourceExtractionCandidates.status, "pending"),
      ),
    );
}

async function getPendingCandidate(
  productId: string,
  sourceId: string,
  extractionId: string,
  candidateId: string,
  db: AppDb,
) {
  const rows = await db
    .select()
    .from(sourceExtractionCandidates)
    .where(
      and(
        eq(sourceExtractionCandidates.id, candidateId),
        eq(sourceExtractionCandidates.productId, productId),
        eq(sourceExtractionCandidates.sourceId, sourceId),
        eq(sourceExtractionCandidates.extractionId, extractionId),
        eq(sourceExtractionCandidates.status, "pending"),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

async function assertNoPendingConflicts(candidateId: string, db: AppDb) {
  const rows = await db
    .select({ id: knowledgeConflicts.id })
    .from(knowledgeConflicts)
    .where(
      and(
        eq(knowledgeConflicts.candidateId, candidateId),
        eq(knowledgeConflicts.resolution, "pending"),
      ),
    )
    .limit(1);

  if (rows.length) {
    throw new Error("Resolve potential conflicts before approving this candidate.");
  }
}

async function markKnowledgeOutdated(
  productId: string,
  knowledgeItemId: string,
  userId: string,
  db: AppDb,
) {
  const [existing] = await db
    .select()
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.id, knowledgeItemId),
        eq(knowledgeItems.productId, productId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error("Existing knowledge is not accessible.");
  }

  if (existing.lifecycleStatus === "outdated") {
    return existing;
  }

  const [updated] = await db
    .update(knowledgeItems)
    .set({
      lifecycleStatus: "outdated",
      validUntil: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(knowledgeItems.id, knowledgeItemId))
    .returning();

  await db.insert(knowledgeEvents).values({
    productId,
    featureId: existing.featureId,
    knowledgeItemId,
    eventType: "marked_outdated",
    fromLifecycleStatus: existing.lifecycleStatus,
    toLifecycleStatus: "outdated",
    title: existing.title,
    note: "Marked outdated during extraction conflict review.",
    createdBy: userId,
  });

  return updated;
}

async function getVerifiedKnowledgeForConflictScope(
  productId: string,
  moduleId: string | null,
  featureId: string | null,
  db: AppDb,
) {
  const scopeConditions = [isNull(knowledgeItems.moduleId)];

  if (moduleId) {
    scopeConditions.push(eq(knowledgeItems.moduleId, moduleId));
  }

  if (featureId) {
    const relationships = await db
      .select()
      .from(featureRelationships)
      .where(
        or(
          eq(featureRelationships.fromFeatureId, featureId),
          eq(featureRelationships.toFeatureId, featureId),
        ),
      );
    const relatedFeatureIds = relationships.map((relationship) =>
      relationship.fromFeatureId === featureId
        ? relationship.toFeatureId
        : relationship.fromFeatureId,
    );

    scopeConditions.push(eq(knowledgeItems.featureId, featureId));
    if (relatedFeatureIds.length) {
      scopeConditions.push(inArray(knowledgeItems.featureId, relatedFeatureIds));
    }
  }

  return db
    .select()
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.productId, productId),
        eq(knowledgeItems.lifecycleStatus, "verified"),
        or(...scopeConditions),
      ),
    );
}

function existingKnowledgeSnapshot(
  existing: typeof knowledgeItems.$inferSelect | undefined,
) {
  if (!existing) {
    return {};
  }

  return {
    id: existing.id,
    title: existing.title,
    body: existing.body,
    knowledgeType: existing.knowledgeType,
    authority: existing.authority,
    lifecycleStatus: existing.lifecycleStatus,
    lastVerifiedAt: existing.lastVerifiedAt,
    validFrom: existing.validFrom,
    validUntil: existing.validUntil,
    moduleId: existing.moduleId,
    featureId: existing.featureId,
  };
}

function candidateSnapshot(
  candidate: typeof sourceExtractionCandidates.$inferSelect,
) {
  return {
    id: candidate.id,
    title: candidate.title,
    body: candidate.body,
    knowledgeType: candidate.knowledgeType,
    suggestedAuthority: candidate.suggestedAuthority,
    confidence: candidate.confidence,
    sourceEvidence: candidate.sourceEvidence,
    appearsHistorical: candidate.appearsHistorical,
    possibleConflicts: candidate.possibleConflicts,
    moduleId: candidate.moduleId,
    featureId: candidate.featureId,
  };
}

async function buildExistingFeatureContext(
  productId: string,
  userId: string,
  detail: NonNullable<Awaited<ReturnType<typeof getSourceDetail>>>,
  db: AppDb,
): Promise<ExistingFeatureContext> {
  const featureKnowledge = detail.source.featureId
    ? await getFeatureKnowledge(detail.source.featureId, productId, userId, db)
    : detail.knowledge;

  return {
    productName: detail.product.name,
    moduleName: detail.module?.name ?? null,
    featureName: detail.feature?.name ?? null,
    existingKnowledge: featureKnowledge.map((item) => ({
      title: item.title,
      body: item.body,
      knowledgeType: item.knowledgeType,
      authority: item.authority,
      lifecycleStatus: item.lifecycleStatus,
    })),
  };
}
