import { describe, expect, it } from "vitest";

import {
  buildIntelligenceRetrievalRequest,
  buildIntelligenceTaskDescription,
  getQuestionTypeConfig,
  intelligenceQuestionTypes,
  parseIntelligenceQuerySearchParams,
} from "@/lib/product-intelligence/question-types";

describe("Product Intelligence question types", () => {
  it("keeps guided question routing explicit", () => {
    expect(intelligenceQuestionTypes.map((question) => question.value)).toEqual([
      "change_impact",
      "same_problem",
      "pattern_rationale",
      "modification_considerations",
      "recent_decisions",
      "outdated_or_conflicting",
      "reused_components_patterns",
    ]);
    expect(getQuestionTypeConfig("pattern_rationale")?.retrievalIntent).toContain(
      "rationale",
    );
  });

  it("parses the structured query flow", () => {
    const params = new URLSearchParams({
      productId: "11111111-1111-4111-8111-111111111111",
      moduleId: "22222222-2222-4222-8222-222222222222",
      featureId: "33333333-3333-4333-8333-333333333333",
      questionType: "change_impact",
      detail: "Changing the bulk review footer.",
    });

    expect(parseIntelligenceQuerySearchParams(params)).toEqual({
      productId: "11111111-1111-4111-8111-111111111111",
      moduleId: "22222222-2222-4222-8222-222222222222",
      featureId: "33333333-3333-4333-8333-333333333333",
      questionType: "change_impact",
      detail: "Changing the bulk review footer.",
    });
  });

  it("builds feature-constrained retrieval input", () => {
    expect(
      buildIntelligenceRetrievalRequest({
        productId: "product-1",
        userId: "user-1",
        taskDescription: "What should change?",
        featureId: "feature-1",
      }),
    ).toMatchObject({
      productId: "product-1",
      userId: "user-1",
      taskDescription: "What should change?",
      primaryFeatureId: "feature-1",
      limit: 10,
    });
  });

  it("builds a product-aware task description for answer generation", () => {
    const description = buildIntelligenceTaskDescription({
      questionType: "same_problem",
      questionLabel: "Where else do we solve this same problem?",
      productName: "Nextzen Demo",
      moduleName: "Application Review",
      featureName: "Bulk Review",
      detail: "Compare bulk action confirmation patterns.",
    });

    expect(description).toContain("Where else do we solve this same problem?");
    expect(description).toContain("Product: Nextzen Demo");
    expect(description).toContain("Feature: Bulk Review");
  });
});
