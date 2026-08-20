import { describe, expect, it } from "vitest";

import { AIMalformedResponseError } from "@/ai/errors";
import { extractProductKnowledge } from "@/ai/operations/extract-product-knowledge";
import { buildProductKnowledgeExtractionPrompts } from "@/ai/prompts/product-knowledge-extraction";
import type {
  AIProvider,
  GenerateStructuredOutputRequest,
} from "@/ai/provider";
import { productKnowledgeExtractionSchema } from "@/ai/schemas/product-knowledge-extraction";
import type { SourceExtractionInput } from "@/lib/source-ingestion/extraction";

describe("extractProductKnowledge", () => {
  it("constructs an extraction request for atomic Product Memory candidates", () => {
    const prompts = buildProductKnowledgeExtractionPrompts(
      source,
      existingFeatureContext,
    );

    expect(prompts.systemPrompt).toContain("Do not summarize the document");
    expect(prompts.systemPrompt).toContain("Prefer multiple atomic knowledge items");
    expect(prompts.userPrompt).toContain("Only assigned reviewers can approve reports");
    expect(prompts.userPrompt).toContain("suggestedAuthority");
  });

  it("returns proposed candidates awaiting human review", async () => {
    const provider = fakeProvider({
      sourceId: "source-1",
      candidates: [
        {
          title: "Approval requires assigned reviewer",
          body: "Only assigned reviewers can approve reports.",
          knowledgeType: "permission",
          suggestedAuthority: "high",
          confidence: 88,
          reasoningSummary: "The source states this as an approval constraint.",
          sourceEvidence: [
            {
              sourceId: "source-1",
              supportingText: "Only assigned reviewers can approve reports.",
            },
          ],
          potentialRelationships: ["Touches approval permissions"],
          appearsHistorical: false,
          possibleConflicts: [],
        },
      ],
      skippedClaims: [],
    });

    const extraction = await extractProductKnowledge(
      source,
      existingFeatureContext,
      provider,
    );

    expect(extraction.candidates).toHaveLength(1);
    expect(extraction.candidates[0]).toMatchObject({
      suggestedAuthority: "high",
      reasoningSummary: "The source states this as an approval constraint.",
    });
  });

  it("rejects extracted candidates that cite a different source", async () => {
    const provider = fakeProvider({
      sourceId: "source-1",
      candidates: [
        {
          title: "Approval requires assigned reviewer",
          body: "Only assigned reviewers can approve reports.",
          knowledgeType: "permission",
          suggestedAuthority: "high",
          confidence: 88,
          reasoningSummary: "The source states this as an approval constraint.",
          sourceEvidence: [
            {
              sourceId: "different-source",
              supportingText: "Only assigned reviewers can approve reports.",
            },
          ],
          potentialRelationships: [],
          appearsHistorical: false,
          possibleConflicts: [],
        },
      ],
      skippedClaims: [],
    });

    await expect(
      extractProductKnowledge(source, existingFeatureContext, provider),
    ).rejects.toThrow(AIMalformedResponseError);
  });

  it("rejects malformed extraction candidate shape", () => {
    expect(() => productKnowledgeExtractionSchema.parse({
      sourceId: "source-1",
      candidates: [
        {
          title: "Already trusted claim",
          body: "This should not be trusted directly.",
          knowledgeType: "product_rule",
          suggestedAuthority: "canonical",
          confidence: 90,
          sourceEvidence: [
            { sourceId: "source-1", supportingText: "Evidence text." },
          ],
          potentialRelationships: [],
          appearsHistorical: false,
          possibleConflicts: [],
        },
      ],
      skippedClaims: [],
    })).toThrow();
  });
});

const source: SourceExtractionInput = {
  sourceId: "source-1",
  productId: "product-1",
  moduleId: "module-1",
  featureId: "feature-1",
  sourceType: "prd",
  name: "Approval requirement",
  url: null,
  rawContent: "Only assigned reviewers can approve reports.",
  metadata: { fictional: true },
};

const existingFeatureContext = {
  productName: "Nextzen Demo",
  moduleName: "Progress Reporting",
  featureName: "Approve Progress Report",
  existingKnowledge: [],
};

function fakeProvider(output: unknown): AIProvider {
  return {
    async generateText() {
      return "";
    },
    async generateStructuredOutput<T>(
      request: GenerateStructuredOutputRequest<T>,
    ) {
      return request.schema.parse(output);
    },
    async generateEmbedding() {
      return [];
    },
  };
}
