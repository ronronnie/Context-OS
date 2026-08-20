import { and, asc, desc, eq } from "drizzle-orm";

import { extractProductKnowledge } from "@/ai";
import type { AIProvider } from "@/ai/provider";
import type { ExistingFeatureContext } from "@/ai/prompts/product-knowledge-extraction";
import { db as defaultDb, type AppDb } from "@/db";
import { getFeatureKnowledge } from "@/db/queries/features";
import { getSourceDetail } from "@/db/queries/sources";
import { assertProductOwnership } from "@/db/queries/products";
import {
  knowledgeEvents,
  knowledgeItems,
  knowledgeSources,
  sourceExtractionCandidates,
  sourceExtractions,
} from "@/db/schema/index";
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
    await db.insert(sourceExtractionCandidates).values(
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
    );
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

  return {
    ...detail,
    extraction,
    candidates,
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

  const approved = [];
  for (const candidate of candidates) {
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
