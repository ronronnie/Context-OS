import { z } from "zod";

import {
  sourceEvidenceSchema,
  splitReviewList,
  type CandidateReviewEdits,
} from "@/lib/source-ingestion/review-model";

const candidateReviewFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  body: z.string().trim().min(1, "Body is required."),
  knowledgeType: z.enum([
    "current_behaviour",
    "product_rule",
    "business_rule",
    "ux_pattern",
    "technical_constraint",
    "permission",
    "decision",
    "rejected_approach",
    "known_issue",
    "open_question",
    "research_insight",
    "component",
    "terminology",
  ]),
  authority: z.enum(["canonical", "high", "medium", "low", "unverified"]),
  confidence: z.coerce.number().int().min(0).max(100),
  reasoningSummary: z.string().trim().min(1, "Reasoning is required."),
  sourceEvidence: z.string().trim().min(1, "Source evidence is required."),
  potentialRelationships: z.string().default(""),
  possibleConflicts: z.string().default(""),
});

export function parseCandidateReviewFormData(
  formData: FormData,
): CandidateReviewEdits {
  const parsed = candidateReviewFormSchema.parse(Object.fromEntries(formData));

  return {
    title: parsed.title,
    body: parsed.body,
    knowledgeType: parsed.knowledgeType,
    authority: parsed.authority,
    confidence: parsed.confidence,
    reasoningSummary: parsed.reasoningSummary,
    sourceEvidence: parseSourceEvidence(parsed.sourceEvidence),
    potentialRelationships: splitReviewList(parsed.potentialRelationships),
    possibleConflicts: splitReviewList(parsed.possibleConflicts),
  };
}

export function parseApprovedCandidateIds(formData: FormData) {
  return formData
    .getAll("approvedCandidateIds")
    .map(String)
    .filter(Boolean);
}

function parseSourceEvidence(value: string) {
  try {
    return sourceEvidenceSchema.parse(JSON.parse(value));
  } catch {
    throw new Error("Source evidence must be valid JSON evidence.");
  }
}
