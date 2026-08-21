import { z } from "zod";

import type { decisionCaptureCandidates } from "@/db/schema/index";
import {
  sourceEvidenceSchema,
  splitReviewList,
} from "@/lib/source-ingestion/review-model";

export type TaskOutcomeInput = {
  summary: string;
  finalDecisionNotes: string;
  references: string;
  pastedOutcome: string;
  moduleId: string | null;
  featureId: string | null;
};

export type DecisionCandidateReviewEdits = {
  title: string;
  body: string;
  knowledgeType: (typeof decisionCaptureCandidates.$inferSelect)["knowledgeType"];
  authority: (typeof decisionCaptureCandidates.$inferSelect)["suggestedAuthority"];
  confidence: number;
  reasoningSummary: string;
  sourceEvidence: Array<{ sourceId: string; supportingText: string }>;
  potentialRelationships: string[];
  possibleConflicts: string[];
  relatedKnowledgeId: string | null;
  relationshipType: string;
  relationshipReason: string;
};

export function buildTaskOutcomeSourceContent(input: TaskOutcomeInput) {
  return [
    "# Task outcome",
    "",
    "## Summary",
    input.summary,
    "",
    "## Final decision notes",
    input.finalDecisionNotes || "None supplied.",
    "",
    "## Links and references",
    input.references || "None supplied.",
    "",
    "## Pasted result",
    input.pastedOutcome,
  ].join("\n");
}

export function decisionCandidateToVerifiedKnowledgeInput(
  candidate: typeof decisionCaptureCandidates.$inferSelect,
  edits: DecisionCandidateReviewEdits,
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

export function decisionCandidateEvidenceIncludesSource(
  edits: DecisionCandidateReviewEdits,
  sourceId: string,
) {
  return edits.sourceEvidence.some((evidence) => evidence.sourceId === sourceId);
}

export function formatDecisionCandidateRelationships(candidate: {
  relevantOldKnowledgeIds: string[];
  supersededKnowledgeIds: string[];
}) {
  return [
    ...candidate.relevantOldKnowledgeIds.map((id) => `related_to:${id}`),
    ...candidate.supersededKnowledgeIds.map((id) => `supersedes:${id}`),
  ];
}

const taskOutcomeFormSchema = z.object({
  summary: z.string().trim().min(1, "Summary is required."),
  finalDecisionNotes: z.string().trim().default(""),
  references: z.string().trim().default(""),
  pastedOutcome: z.string().trim().min(1, "Paste the task outcome first."),
  moduleId: z.string().trim().default(""),
  featureId: z.string().trim().default(""),
});

const decisionCandidateReviewFormSchema = z.object({
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
  relatedKnowledgeId: z.string().trim().default(""),
  relationshipType: z.string().trim().default("related_to"),
  relationshipReason: z.string().trim().default(""),
});

export function parseTaskOutcomeFormData(formData: FormData): TaskOutcomeInput {
  const parsed = taskOutcomeFormSchema.parse(Object.fromEntries(formData));

  return {
    summary: parsed.summary,
    finalDecisionNotes: parsed.finalDecisionNotes,
    references: parsed.references,
    pastedOutcome: parsed.pastedOutcome,
    moduleId: parsed.moduleId || null,
    featureId: parsed.featureId || null,
  };
}

export function parseDecisionCandidateReviewFormData(
  formData: FormData,
): DecisionCandidateReviewEdits {
  const parsed = decisionCandidateReviewFormSchema.parse(
    Object.fromEntries(formData),
  );

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
    relatedKnowledgeId: parsed.relatedKnowledgeId || null,
    relationshipType: parsed.relationshipType || "related_to",
    relationshipReason: parsed.relationshipReason,
  };
}

function parseSourceEvidence(value: string) {
  try {
    return sourceEvidenceSchema.parse(JSON.parse(value));
  } catch {
    throw new Error("Source evidence must be valid JSON evidence.");
  }
}
