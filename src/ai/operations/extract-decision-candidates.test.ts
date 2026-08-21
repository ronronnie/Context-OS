import { describe, expect, it } from "vitest";

import { AIMalformedResponseError } from "@/ai/errors";
import { extractDecisionCandidates } from "@/ai/operations/extract-decision-candidates";
import { buildDecisionCapturePrompts } from "@/ai/prompts/decision-capture";
import type {
  AIProvider,
  GenerateStructuredOutputRequest,
} from "@/ai/provider";
import { decisionCaptureExtractionSchema } from "@/ai/schemas/decision-capture";

describe("extractDecisionCandidates", () => {
  it("constructs a task outcome extraction request", () => {
    const prompts = buildDecisionCapturePrompts(input);

    expect(prompts.systemPrompt).toContain("Do not mark anything as trusted");
    expect(prompts.systemPrompt).toContain("Every candidate must cite the outcome sourceId");
    expect(prompts.userPrompt).toContain("technical constraints");
    expect(prompts.userPrompt).toContain("existing-memory-1");
  });

  it("returns pending source-backed decision candidates", async () => {
    const extraction = await extractDecisionCandidates(
      input,
      fakeProvider({
        outcomeId: "outcome-1",
        sourceId: "source-1",
        candidates: [
          {
            title: "Bulk approve keeps row-level errors",
            body: "Bulk approval should keep row-level errors visible after submission.",
            knowledgeType: "decision",
            suggestedAuthority: "high",
            confidence: 86,
            reasoningSummary: "The pasted outcome states this as the final decision.",
            sourceEvidence: [
              {
                sourceId: "source-1",
                supportingText: "Keep row-level errors visible after submission.",
              },
            ],
            potentialRelationships: ["Touches bulk review"],
            possibleConflicts: [],
            relevantOldKnowledgeIds: ["existing-memory-1"],
            supersededKnowledgeIds: [],
          },
        ],
        skippedItems: [],
      }),
    );

    expect(extraction.candidates).toHaveLength(1);
    expect(extraction.candidates[0]).toMatchObject({
      knowledgeType: "decision",
      suggestedAuthority: "high",
    });
  });

  it("rejects candidates that do not cite the task outcome source", async () => {
    await expect(
      extractDecisionCandidates(
        input,
        fakeProvider({
          outcomeId: "outcome-1",
          sourceId: "source-1",
          candidates: [
            {
              title: "Bulk approve keeps row-level errors",
              body: "Bulk approval should keep row-level errors visible after submission.",
              knowledgeType: "decision",
              suggestedAuthority: "high",
              confidence: 86,
              reasoningSummary: "The pasted outcome states this as final.",
              sourceEvidence: [
                {
                  sourceId: "other-source",
                  supportingText: "Keep row-level errors visible.",
                },
              ],
              potentialRelationships: [],
              possibleConflicts: [],
              relevantOldKnowledgeIds: [],
              supersededKnowledgeIds: [],
            },
          ],
          skippedItems: [],
        }),
      ),
    ).rejects.toThrow(AIMalformedResponseError);
  });

  it("rejects unsupported decision capture shapes", () => {
    expect(() =>
      decisionCaptureExtractionSchema.parse({
        outcomeId: "outcome-1",
        sourceId: "source-1",
        candidates: [
          {
            title: "Generic implementation note",
            body: "This is missing review reasoning.",
            knowledgeType: "decision",
            suggestedAuthority: "high",
            confidence: 80,
            sourceEvidence: [
              { sourceId: "source-1", supportingText: "Evidence." },
            ],
          },
        ],
      }),
    ).toThrow();
  });
});

const input = {
  product: {
    id: "product-1",
    name: "Nextzen Demo",
    description: "Fictional internal product.",
  },
  task: {
    id: "task-1",
    title: "Design bulk approval",
    description: "Design the bulk approval workflow.",
  },
  contextPack: {
    id: "pack-1",
    version: 1,
    generatedContent: "Use current Progress Report Review patterns.",
  },
  outcome: {
    id: "outcome-1",
    sourceId: "source-1",
    summary: "Bulk approval decision captured.",
    finalDecisionNotes: "Keep row-level errors visible after submission.",
    references: "https://example.com/pr/1",
    pastedOutcome: "Final decision: keep row-level errors visible after submission.",
    moduleId: "module-1",
    featureId: "feature-1",
  },
  existingKnowledge: [
    {
      id: "existing-memory-1",
      title: "Single approval keeps errors inline",
      body: "Errors remain inline for single report approval.",
      knowledgeType: "ux_pattern",
      authority: "high",
      lifecycleStatus: "verified",
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
