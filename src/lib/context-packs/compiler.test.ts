import { describe, expect, it } from "vitest";

import type { Product, Source } from "@/db/schema";
import { compileContextPack } from "@/lib/context-packs/compiler";
import { parseTaskFormData } from "@/lib/context-packs/forms";
import type { RankedRetrievalResult } from "@/lib/retrieval/hybrid-ranking";

describe("context pack compiler", () => {
  it("parses task creation input", () => {
    const form = new FormData();
    form.set("title", "Add bulk approval");
    form.set("description", "I want to add bulk approval to Progress Report Review.");
    form.set("productId", "11111111-1111-4111-8111-111111111111");
    form.set("primaryFeatureId", "22222222-2222-4222-8222-222222222222");
    form.set("taskIntent", "design");

    expect(parseTaskFormData(form)).toEqual({
      title: "Add bulk approval",
      description: "I want to add bulk approval to Progress Report Review.",
      productId: "11111111-1111-4111-8111-111111111111",
      primaryFeatureId: "22222222-2222-4222-8222-222222222222",
      taskIntent: "design",
    });
  });

  it("compiles retrieved memory into source-backed pack sections", () => {
    const pack = compileContextPack({
      task: {
        title: "Add bulk approval",
        description: "I want to add bulk approval to Progress Report Review.",
        taskIntent: "design",
      },
      product: product(),
      module: null,
      feature: null,
      results: [
        result({
          title: "Approval permissions are role-limited",
          body: "Only Program Administrators and assigned Reviewers can approve reports.",
          knowledgeType: "permission",
          sources: [source("Progress report approval requirement")],
        }),
        result({
          title: "Permanent bulk toolbar was rejected",
          body: "A permanently visible bulk toolbar was rejected.",
          knowledgeType: "rejected_approach",
          lifecycleStatus: "rejected",
          relationshipPath:
            "contradicts: rejected persistent toolbar contradicts always-visible controls",
          sources: [source("Old rejected bulk toolbar exploration")],
        }),
      ],
    });

    expect(pack).toContain("## Task");
    expect(pack).toContain("## Permissions");
    expect(pack).toContain("Approval permissions are role-limited");
    expect(pack).toContain("Evidence: Progress report approval requirement");
    expect(pack).toContain("## Rejected Approaches");
    expect(pack).toContain("REJECTED/HISTORICAL");
    expect(pack).toContain("## Suggested Prompt");
    expect(pack).toContain("Contradictory memory exists");
  });
});

function product(): Product {
  return {
    id: "product",
    name: "Nextzen Demo",
    description: "Fictional product.",
    createdBy: "user",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  };
}

function source(name: string): Source {
  return {
    id: name,
    productId: "product",
    moduleId: null,
    featureId: null,
    sourceType: "prd",
    name,
    url: null,
    rawContent: "Source content.",
    metadata: { sourceDate: "2026-04-18" },
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    createdBy: "user",
  };
}

function result(
  overrides: Partial<RankedRetrievalResult["knowledgeItem"]> & {
    sources: Source[];
    relationshipPath?: string;
  },
) {
  return {
    knowledgeItem: {
      id: overrides.title ?? "knowledge",
      productId: "product",
      moduleId: null,
      featureId: null,
      title: overrides.title ?? "Knowledge",
      body: overrides.body ?? "Knowledge body.",
      knowledgeType: overrides.knowledgeType ?? "permission",
      authority: overrides.authority ?? "canonical",
      confidence: overrides.confidence ?? 90,
      lifecycleStatus: overrides.lifecycleStatus ?? "verified",
      validFrom: null,
      validUntil: null,
      lastVerifiedAt: new Date("2026-08-01T00:00:00.000Z"),
      createdBy: "user",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    },
    semanticScore: 0.8,
    finalScore: 0.92,
    reasonForInclusion: "Relevant permission rule for the requested workflow.",
    relationshipPath: overrides.relationshipPath ?? null,
    diagnostics: undefined,
    sources: overrides.sources,
  };
}
