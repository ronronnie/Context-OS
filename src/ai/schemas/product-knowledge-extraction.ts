import { z } from "zod";

const knowledgeTypeSchema = z.enum([
  "current_behaviour",
  "product_rule",
  "business_rule",
  "ux_pattern",
  "technical_constraint",
  "permission",
  "decision",
  "rejected_approach",
  "known_issue",
  "research_insight",
  "component",
  "terminology",
]);

const authoritySchema = z.enum([
  "canonical",
  "high",
  "medium",
  "low",
  "unverified",
]);

export const extractionCandidateSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  knowledgeType: knowledgeTypeSchema,
  authority: authoritySchema,
  confidence: z.number().int().min(0).max(100),
  lifecycleStatus: z.literal("proposed"),
  sourceEvidence: z.array(
    z.object({
      sourceId: z.string().trim().min(1),
      supportingText: z.string().trim().min(1),
    }),
  ).min(1),
  relationshipHints: z.array(z.string().trim().min(1)).default([]),
  contradictionHints: z.array(z.string().trim().min(1)).default([]),
  needsHumanReview: z.literal(true),
});

export const productKnowledgeExtractionSchema = z.object({
  sourceId: z.string().trim().min(1),
  candidates: z.array(extractionCandidateSchema),
  skippedClaims: z.array(
    z.object({
      claim: z.string().trim().min(1),
      reason: z.string().trim().min(1),
    }),
  ).default([]),
});

export type ExtractionCandidate = z.infer<typeof extractionCandidateSchema>;
export type ProductKnowledgeExtraction = z.infer<
  typeof productKnowledgeExtractionSchema
>;
