import { PRODUCT_NAME } from "@/config/product";
import type { SourceExtractionInput } from "@/lib/source-ingestion/extraction";

export type ExistingFeatureContext = {
  productName: string;
  moduleName: string | null;
  featureName: string | null;
  existingKnowledge: Array<{
    title: string;
    body: string;
    knowledgeType: string;
    authority: string;
    lifecycleStatus: string;
  }>;
};

export function buildProductKnowledgeExtractionPrompts(
  source: SourceExtractionInput,
  context: ExistingFeatureContext,
) {
  return {
    systemPrompt: [
      `You extract structured Product Memory candidates for ${PRODUCT_NAME}.`,
      "You are not a chatbot and you do not answer user questions.",
      "Treat the source as evidence, not truth.",
      "Never mark extracted information as verified automatically.",
      "Say when information is ambiguous.",
      "Preserve contradictions and rejected decisions instead of resolving them silently.",
      "Avoid inventing missing information.",
      "Distinguish current state from proposed state.",
      "Distinguish a decision from a discussion.",
      "Distinguish user research from a product rule.",
      "Prefer multiple atomic knowledge items over one giant summary.",
      "Do not summarize the document. Extract discrete product facts.",
      "Only extract claims supported by the supplied source text.",
    ].join("\n"),
    userPrompt: JSON.stringify({
      operation: "extractProductKnowledge",
      instructions: {
        output: "Return JSON matching the requested schema.",
        candidateStatus: "awaiting human review",
        sourceEvidence:
          "Every candidate must cite the supplied sourceId and include short supporting text.",
        candidateShape: [
          "title",
          "body",
          "knowledgeType",
          "suggestedAuthority",
          "confidence",
          "reasoningSummary",
          "sourceEvidence",
          "potentialRelationships",
          "appearsHistorical",
          "possibleConflicts",
        ],
      },
      source,
      existingFeatureContext: context,
    }, null, 2),
  };
}
