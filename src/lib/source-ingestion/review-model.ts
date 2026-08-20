import { z } from "zod";

import type { sourceExtractionCandidates } from "@/db/schema/index";

export const sourceEvidenceSchema = z.array(
  z.object({
    sourceId: z.string().trim().min(1),
    supportingText: z.string().trim().min(1),
  }),
).min(1);

export type CandidateReviewEdits = {
  title: string;
  body: string;
  knowledgeType: (typeof sourceExtractionCandidates.$inferSelect)["knowledgeType"];
  authority: (typeof sourceExtractionCandidates.$inferSelect)["suggestedAuthority"];
  confidence: number;
  reasoningSummary: string;
  sourceEvidence: Array<{ sourceId: string; supportingText: string }>;
  potentialRelationships: string[];
  possibleConflicts: string[];
};

export function candidateToVerifiedKnowledgeInput(
  candidate: typeof sourceExtractionCandidates.$inferSelect,
  edits: CandidateReviewEdits,
) {
  return {
    productId: candidate.productId,
    moduleId: candidate.moduleId,
    featureId: candidate.featureId,
    title: edits.title,
    body: edits.body,
    knowledgeType: edits.knowledgeType,
    authority: edits.authority,
    confidence: edits.confidence,
    lifecycleStatus: "verified" as const,
    lastVerifiedAt: new Date(),
  };
}

export function candidateEvidenceIncludesSource(
  edits: CandidateReviewEdits,
  sourceId: string,
) {
  return edits.sourceEvidence.some((evidence) => evidence.sourceId === sourceId);
}

export function candidateCanEnterProductMemory(status: string) {
  return status === "approved";
}

export function getCandidateReviewDisplay(
  candidate: Pick<
    typeof sourceExtractionCandidates.$inferSelect,
    | "title"
    | "knowledgeType"
    | "suggestedAuthority"
    | "confidence"
    | "status"
    | "sourceEvidence"
    | "possibleConflicts"
  >,
) {
  return {
    title: candidate.title,
    type: candidate.knowledgeType,
    suggestedAuthority: candidate.suggestedAuthority,
    confidenceLabel: `${candidate.confidence}% confidence`,
    status: candidate.status,
    evidenceCount: candidate.sourceEvidence.length,
    possibleConflictCount: candidate.possibleConflicts.length,
  };
}

export function splitReviewList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
