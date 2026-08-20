import type { AIProvider } from "@/ai/provider";
import { createAIProvider } from "@/ai/provider";
import {
  productKnowledgeExtractionSchema,
  type ProductKnowledgeExtraction,
} from "@/ai/schemas/product-knowledge-extraction";
import type { ExistingFeatureContext } from "@/ai/prompts/product-knowledge-extraction";
import { buildProductKnowledgeExtractionPrompts } from "@/ai/prompts/product-knowledge-extraction";
import { AIMalformedResponseError } from "@/ai/errors";
import type { SourceExtractionInput } from "@/lib/source-ingestion/extraction";

export async function extractProductKnowledge(
  source: SourceExtractionInput,
  existingFeatureContext: ExistingFeatureContext,
  provider: AIProvider = createAIProvider(),
): Promise<ProductKnowledgeExtraction> {
  const prompts = buildProductKnowledgeExtractionPrompts(
    source,
    existingFeatureContext,
  );
  const extraction = await provider.generateStructuredOutput({
    ...prompts,
    schema: productKnowledgeExtractionSchema,
    schemaName: "ProductKnowledgeExtraction",
    schemaDescription:
      "Source-backed Product Memory candidates awaiting human verification.",
    temperature: 0,
  });

  assertExtractionReferencesSource(extraction, source.sourceId);

  return extraction;
}

function assertExtractionReferencesSource(
  extraction: ProductKnowledgeExtraction,
  sourceId: string,
) {
  if (extraction.sourceId !== sourceId) {
    throw new AIMalformedResponseError(
      "AI extraction response referenced a different source id.",
    );
  }

  for (const candidate of extraction.candidates) {
    const hasCurrentSource = candidate.sourceEvidence.some(
      (evidence) => evidence.sourceId === sourceId,
    );

    if (!hasCurrentSource) {
      throw new AIMalformedResponseError(
        "AI extraction candidate did not cite the current source.",
      );
    }
  }
}
