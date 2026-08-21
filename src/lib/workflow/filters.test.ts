import { describe, expect, it } from "vitest";

import {
  hasActiveKnowledgeFilters,
  hasActiveSourceFilters,
  parseKnowledgeFilters,
  parseSourceFilters,
} from "@/lib/workflow/filters";

describe("workflow filters", () => {
  it("parses knowledge filters for type, lifecycle, authority, feature, and module", () => {
    const filters = parseKnowledgeFilters({
      productId: "11111111-1111-4111-8111-111111111111",
      moduleId: "22222222-2222-4222-8222-222222222222",
      featureId: "33333333-3333-4333-8333-333333333333",
      knowledgeType: "decision",
      lifecycleStatus: "verified",
      authority: "canonical",
    });

    expect(filters).toMatchObject({
      knowledgeType: "decision",
      lifecycleStatus: "verified",
      authority: "canonical",
    });
    expect(hasActiveKnowledgeFilters(filters)).toBe(true);
  });

  it("parses source filters by source type and graph location", () => {
    const filters = parseSourceFilters({
      sourceType: "design_system_doc",
      moduleId: "22222222-2222-4222-8222-222222222222",
    });

    expect(filters).toEqual({
      sourceType: "design_system_doc",
      moduleId: "22222222-2222-4222-8222-222222222222",
    });
    expect(hasActiveSourceFilters(filters)).toBe(true);
  });

  it("rejects unsupported filter values", () => {
    expect(() => parseKnowledgeFilters({ knowledgeType: "chat_message" })).toThrow();
    expect(() => parseSourceFilters({ sourceType: "spreadsheet" })).toThrow();
  });
});
