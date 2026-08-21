import { describe, expect, it } from "vitest";

import type { KnowledgeItem } from "@/db/schema";
import { rankRetrievedKnowledgeCandidates } from "@/lib/retrieval/hybrid-ranking";

describe("hybrid retrieval ranking", () => {
  it("prioritizes Nextzen bulk approval memory using graph proximity and authority", () => {
    const task = "I want to add bulk approval to Progress Report Review.";
    const ranked = rankRetrievedKnowledgeCandidates(
      task,
      [
        candidate({
          title: "Progress Report approval behavior",
          body: "Progress reports can be approved only after reviewer checks pass.",
          knowledgeType: "current_behaviour",
          authority: "canonical",
          featureId: "progress-review",
          semanticScore: 0.7,
        }),
        candidate({
          title: "Approval permissions are role-limited",
          body: "Only Program Administrators and assigned Reviewers can approve reports.",
          knowledgeType: "permission",
          authority: "canonical",
          featureId: "progress-review",
          semanticScore: 0.68,
        }),
        candidate({
          title: "Compliance restrictions block invalid approvals",
          body: "Reports containing unresolved compliance restrictions cannot be approved.",
          knowledgeType: "business_rule",
          authority: "canonical",
          featureId: "progress-review",
          semanticScore: 0.66,
        }),
        candidate({
          title: "Bulk mutation limit is 100 records",
          body: "Bulk mutations currently accept no more than 100 records.",
          knowledgeType: "technical_constraint",
          authority: "high",
          featureId: "bulk-review",
          semanticScore: 0.63,
          relationshipPath: "constrains: API limit constrains bulk approval.",
        }),
        candidate({
          title: "Application Review bulk action pattern",
          body: "Bulk actions appear after at least one eligible record is selected.",
          knowledgeType: "ux_pattern",
          authority: "high",
          featureId: "bulk-review",
          semanticScore: 0.62,
          relationshipPath: "reuses_pattern_from",
        }),
        candidate({
          title: "BulkActionBar",
          body: "BulkActionBar is already used by Application Review.",
          knowledgeType: "component",
          authority: "high",
          featureId: "bulk-review",
          semanticScore: 0.61,
          relationshipPath: "supports: BulkActionBar supports bulk review workflows.",
        }),
        candidate({
          title: "ConfirmationModal",
          body: "ConfirmationModal is required before irreversible approval actions.",
          knowledgeType: "component",
          authority: "canonical",
          featureId: "bulk-review",
          semanticScore: 0.6,
          relationshipPath:
            "constrains: ConfirmationModal constrains approval interactions.",
        }),
        candidate({
          title: "Rejected persistent toolbar approach",
          body: "A permanently visible bulk toolbar was rejected.",
          knowledgeType: "rejected_approach",
          authority: "high",
          lifecycleStatus: "rejected",
          featureId: "bulk-review",
          semanticScore: 0.62,
          relationshipPath:
            "contradicts: Rejected toolbar contradicts always-visible controls.",
        }),
        candidate({
          title: "Bulk invoice approval wording",
          body: "Finance teams use approval copy in invoice exports.",
          knowledgeType: "terminology",
          authority: "medium",
          featureId: "finance-export",
          semanticScore: 0.74,
        }),
      ],
      false,
    );

    const titles = ranked.slice(0, 8).map((result) => result.knowledgeItem.title);

    expect(titles).toContain("Progress Report approval behavior");
    expect(titles).toContain("Approval permissions are role-limited");
    expect(titles).toContain("Compliance restrictions block invalid approvals");
    expect(titles).toContain("Bulk mutation limit is 100 records");
    expect(titles).toContain("Application Review bulk action pattern");
    expect(titles).toContain("BulkActionBar");
    expect(titles).toContain("ConfirmationModal");
    expect(titles).toContain("Rejected persistent toolbar approach");
    expect(titles.indexOf("Bulk invoice approval wording")).toBe(-1);
  });

  it("includes diagnostics only when requested", () => {
    const [withoutDiagnostics] = rankRetrievedKnowledgeCandidates(
      "Design approval",
      [candidate({ title: "Approval permissions are role-limited" })],
      false,
    );
    const [withDiagnostics] = rankRetrievedKnowledgeCandidates(
      "Design approval",
      [candidate({ title: "Approval permissions are role-limited" })],
      true,
    );

    expect(withoutDiagnostics.diagnostics).toBeUndefined();
    expect(withDiagnostics.diagnostics?.finalScore).toBe(withDiagnostics.finalScore);
  });
});

function candidate(
  overrides: Partial<KnowledgeItem> & {
    semanticScore?: number;
    relationshipPath?: string;
  },
) {
  const item: KnowledgeItem = {
    id: overrides.id ?? overrides.title ?? "knowledge",
    productId: "product",
    moduleId: overrides.moduleId ?? "module",
    featureId: overrides.featureId ?? "progress-review",
    title: overrides.title ?? "Memory",
    body: overrides.body ?? "Memory body.",
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
  };

  return {
    knowledgeItem: item,
    semanticScore: overrides.semanticScore ?? 0.6,
    primaryFeatureId: "progress-review",
    primaryModuleId: "module",
    relatedFeatureIds: ["bulk-review"],
    relationshipPath: overrides.relationshipPath,
    now: new Date("2026-08-21T00:00:00.000Z"),
  };
}
