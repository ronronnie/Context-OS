import { z } from "zod";

const decisionKnowledgeTypeSchema = z.enum([
  "decision",
  "product_rule",
  "ux_pattern",
  "technical_constraint",
  "rejected_approach",
  "open_question",
  "known_issue",
  "terminology",
]);

const authoritySchema = z.enum([
  "canonical",
  "high",
  "medium",
  "low",
  "unverified",
]);

export const decisionCaptureCandidateSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  knowledgeType: decisionKnowledgeTypeSchema,
  suggestedAuthority: authoritySchema,
  confidence: z.number().int().min(0).max(100),
  reasoningSummary: z.string().trim().min(1),
  sourceEvidence: z.array(
    z.object({
      sourceId: z.string().trim().min(1),
      supportingText: z.string().trim().min(1),
    }),
  ).min(1),
  potentialRelationships: z.array(z.string().trim().min(1)).default([]),
  possibleConflicts: z.array(z.string().trim().min(1)).default([]),
  relevantOldKnowledgeIds: z.array(z.string().trim().min(1)).default([]),
  supersededKnowledgeIds: z.array(z.string().trim().min(1)).default([]),
});

export const decisionCaptureExtractionSchema = z.object({
  outcomeId: z.string().trim().min(1),
  sourceId: z.string().trim().min(1),
  candidates: z.array(decisionCaptureCandidateSchema),
  skippedItems: z.array(
    z.object({
      item: z.string().trim().min(1),
      reason: z.string().trim().min(1),
    }),
  ).default([]),
});

export type DecisionCaptureCandidate = z.infer<
  typeof decisionCaptureCandidateSchema
>;
export type DecisionCaptureExtraction = z.infer<
  typeof decisionCaptureExtractionSchema
>;
