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
      "You extract structured Product Memory candidates for Context OS.",
      "You are not a chatbot and you do not answer user questions.",
      "Treat the source as evidence, not truth.",
      "Every candidate must stay proposed and require human review.",
      "Preserve contradictions and rejected decisions instead of resolving them silently.",
      "Only extract claims supported by the supplied source text.",
    ].join("\n"),
    userPrompt: JSON.stringify({
      operation: "extractProductKnowledge",
      instructions: {
        output: "Return JSON matching the requested schema.",
        candidateLifecycleStatus: "proposed",
        needsHumanReview: true,
        sourceEvidence:
          "Every candidate must cite the supplied sourceId and include short supporting text.",
      },
      source,
      existingFeatureContext: context,
    }, null, 2),
  };
}
