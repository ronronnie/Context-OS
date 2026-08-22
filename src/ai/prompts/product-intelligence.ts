import { PRODUCT_NAME } from "@/config/product";
import type { IntelligenceQuestionType } from "@/lib/product-intelligence/question-types";

export type ProductIntelligencePromptInput = {
  question: {
    type: IntelligenceQuestionType;
    label: string;
    detail: string;
  };
  product: {
    id: string;
    name: string;
    description: string;
  };
  module?: {
    id: string;
    name: string;
    description: string;
  } | null;
  feature?: {
    id: string;
    name: string;
    description: string;
  } | null;
  memory: Array<{
    id: string;
    title: string;
    body: string;
    knowledgeType: string;
    authority: string;
    lifecycleStatus: string;
    confidence: number;
    relevanceScore: number;
    reasonForInclusion: string;
    relationshipPath?: string;
    sourceEvidence: Array<{
      id: string;
      name: string;
      sourceType: string;
      url: string | null;
    }>;
  }>;
  graphRelationships: Array<{
    kind: "feature" | "knowledge";
    relationshipType: string;
    from: string;
    to: string;
    reason: string;
  }>;
};

export function buildProductIntelligencePrompts(
  input: ProductIntelligencePromptInput,
) {
  return {
    systemPrompt: [
      `You synthesize structured Product Intelligence for ${PRODUCT_NAME}.`,
      "You are not a general-purpose chat assistant.",
      "Use only the supplied Product Memory, source evidence, and graph relationships.",
      "Do not introduce unsupported product claims.",
      "If the supplied memory is insufficient, say what is unsupported or unknown.",
      "Keep the answer concise and operational for designers, PMs, and engineers.",
      "Every supporting memory reference must use a knowledgeItemId from the supplied memory list.",
    ].join("\n"),
    userPrompt: JSON.stringify({
      operation: "generateProductIntelligenceAnswer",
      instructions: {
        output: "Return JSON matching the requested schema.",
        answerShape: [
          "directAnswer",
          "supportingMemory",
          "relationshipPath",
          "risks",
          "openQuestions",
          "confidence",
          "unsupportedClaims",
        ],
        traceability:
          "supportingMemory must list the memory ids used for the answer. Do not cite missing ids.",
        evidenceBoundary:
          "If a claim cannot be supported by the provided memory or source evidence, put it in unsupportedClaims instead of the direct answer.",
      },
      input,
    }, null, 2),
  };
}
