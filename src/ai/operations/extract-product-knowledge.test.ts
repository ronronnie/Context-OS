import { describe, expect, it } from "vitest";

import { AIMalformedResponseError } from "@/ai/errors";
import { extractProductKnowledge } from "@/ai/operations/extract-product-knowledge";
import type {
  AIProvider,
  GenerateStructuredOutputRequest,
} from "@/ai/provider";
import { productKnowledgeExtractionSchema } from "@/ai/schemas/product-knowledge-extraction";
import type { SourceExtractionInput } from "@/lib/source-ingestion/extraction";

describe("extractProductKnowledge", () => {
  it("returns proposed candidates awaiting human review", async () => {
    const provider = fakeProvider({
      sourceId: "source-1",
      candidates: [
        {
          title: "Approval requires assigned reviewer",
          body: "Only assigned reviewers can approve reports.",
          knowledgeType: "permission",
          authority: "high",
          confidence: 88,
          lifecycleStatus: "proposed",
          sourceEvidence: [
            {
              sourceId: "source-1",
              supportingText: "Only assigned reviewers can approve reports.",
            },
          ],
          relationshipHints: ["Touches approval permissions"],
          contradictionHints: [],
          needsHumanReview: true,
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
      lifecycleStatus: "proposed",
      needsHumanReview: true,
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
          authority: "high",
          confidence: 88,
          lifecycleStatus: "proposed",
          sourceEvidence: [
            {
              sourceId: "different-source",
              supportingText: "Only assigned reviewers can approve reports.",
            },
          ],
          relationshipHints: [],
          contradictionHints: [],
          needsHumanReview: true,
        },
      ],
      skippedClaims: [],
    });

    await expect(
      extractProductKnowledge(source, existingFeatureContext, provider),
    ).rejects.toThrow(AIMalformedResponseError);
  });

  it("rejects malformed extraction lifecycle status", () => {
    expect(() => productKnowledgeExtractionSchema.parse({
      sourceId: "source-1",
      candidates: [
        {
          title: "Already trusted claim",
          body: "This should not be trusted directly.",
          knowledgeType: "product_rule",
          authority: "canonical",
          confidence: 90,
          lifecycleStatus: "verified",
          sourceEvidence: [
            { sourceId: "source-1", supportingText: "Evidence text." },
          ],
          relationshipHints: [],
          contradictionHints: [],
          needsHumanReview: true,
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
