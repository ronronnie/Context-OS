import { describe, expect, it } from "vitest";

import { AIMalformedResponseError } from "@/ai/errors";
import {
  assertAnswerUsesSuppliedMemory,
  generateProductIntelligenceAnswer,
} from "@/ai/operations/generate-product-intelligence-answer";
import { buildProductIntelligencePrompts } from "@/ai/prompts/product-intelligence";
import type {
  AIProvider,
  GenerateStructuredOutputRequest,
} from "@/ai/provider";

describe("generateProductIntelligenceAnswer", () => {
  it("constructs a source-backed structured answer prompt", () => {
    const prompts = buildProductIntelligencePrompts(input);

    expect(prompts.systemPrompt).toContain("not a general-purpose chat");
    expect(prompts.systemPrompt).toContain("Use only the supplied Product Memory");
    expect(prompts.userPrompt).toContain("Bulk review confirmation");
    expect(prompts.userPrompt).toContain("Design system source");
  });

  it("generates a concise answer using supplied Product Memory ids", async () => {
    const answer = await generateProductIntelligenceAnswer(
      input,
      fakeProvider({
        directAnswer: "Use the existing confirmation modal pattern.",
        supportingMemory: [
          {
            knowledgeItemId: "memory-1",
            rationale: "The memory records the canonical confirmation pattern.",
          },
        ],
        relationshipPath: [
          {
            label: "feature: reuses_pattern_from",
            detail: "Bulk Review reuses Application Review confirmation.",
          },
        ],
        risks: ["Changing copy may break audit expectations."],
        openQuestions: ["Confirm whether bulk actions use the same threshold."],
        confidence: 84,
        unsupportedClaims: [],
      }),
    );

    expect(answer.directAnswer).toContain("confirmation modal");
    expect(answer.supportingMemory[0].knowledgeItemId).toBe("memory-1");
  });

  it("rejects unsupported memory references", async () => {
    await expect(
      generateProductIntelligenceAnswer(
        input,
        fakeProvider({
          directAnswer: "Use the existing confirmation modal pattern.",
          supportingMemory: [
            {
              knowledgeItemId: "missing-memory",
              rationale: "This id was not supplied.",
            },
          ],
          relationshipPath: [],
          risks: [],
          openQuestions: [],
          confidence: 40,
          unsupportedClaims: [],
        }),
      ),
    ).rejects.toThrow(AIMalformedResponseError);
  });

  it("surfaces unsupported claim handling as validation logic", () => {
    expect(() =>
      assertAnswerUsesSuppliedMemory(
        {
          directAnswer: "A claim with an invalid citation.",
          supportingMemory: [
            { knowledgeItemId: "not-supplied", rationale: "Unsupported." },
          ],
          relationshipPath: [],
          risks: [],
          openQuestions: [],
          confidence: 25,
          unsupportedClaims: ["The cited memory was not supplied."],
        },
        ["memory-1"],
      ),
    ).toThrow(AIMalformedResponseError);
  });
});

const input = {
  question: {
    type: "pattern_rationale" as const,
    label: "Why do we use this pattern?",
    detail: "Bulk action confirmation",
  },
  product: {
    id: "product-1",
    name: "Nextzen Demo",
    description: "Fictional mature product.",
  },
  module: {
    id: "module-1",
    name: "Application Review",
    description: "Review workflows.",
  },
  feature: {
    id: "feature-1",
    name: "Bulk Review",
    description: "Bulk review actions.",
  },
  memory: [
    {
      id: "memory-1",
      title: "Bulk review confirmation",
      body: "Bulk review uses the canonical confirmation modal.",
      knowledgeType: "ux_pattern",
      authority: "high",
      lifecycleStatus: "verified",
      confidence: 90,
      relevanceScore: 88,
      reasonForInclusion: "Relevant UX pattern.",
      relationshipPath: "reuses_pattern_from: Application Review",
      sourceEvidence: [
        {
          id: "source-1",
          name: "Design system source",
          sourceType: "design_system_doc",
          url: null,
        },
      ],
    },
  ],
  graphRelationships: [
    {
      kind: "feature" as const,
      relationshipType: "reuses_pattern_from",
      from: "Bulk Review",
      to: "Application Review",
      reason: "Shared confirmation modal.",
    },
  ],
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
