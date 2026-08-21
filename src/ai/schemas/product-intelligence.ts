import { z } from "zod";

export const productIntelligenceAnswerSchema = z.object({
  directAnswer: z.string().trim().min(1),
  supportingMemory: z.array(
    z.object({
      knowledgeItemId: z.string().trim().min(1),
      rationale: z.string().trim().min(1),
    }),
  ),
  relationshipPath: z.array(
    z.object({
      label: z.string().trim().min(1),
      detail: z.string().trim().min(1),
    }),
  ).default([]),
  risks: z.array(z.string().trim().min(1)).default([]),
  openQuestions: z.array(z.string().trim().min(1)).default([]),
  confidence: z.number().int().min(0).max(100),
  unsupportedClaims: z.array(z.string().trim().min(1)).default([]),
});

export type ProductIntelligenceAnswer = z.infer<
  typeof productIntelligenceAnswerSchema
>;
