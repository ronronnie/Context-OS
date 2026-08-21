import { describe, expect, it } from "vitest";

import { requireUserId } from "@/db/queries";
import { seedKnowledge, seedSources } from "@/db/seed-data";
import { buildSourceExtractionInput } from "@/lib/source-ingestion/extraction";
import { parseSourceFormData } from "@/lib/source-ingestion/forms";
import {
  getSourceTypeLabel,
  isSupportedSourceType,
  sourceTypes,
} from "@/lib/source-ingestion/source-model";
import { sourceRoute } from "@/lib/routes";

describe("source ingestion", () => {
  it("parses manual source creation input", () => {
    const form = new FormData();
    form.set("productId", "product-1");
    form.set("moduleId", "module-1");
    form.set("featureId", "feature-1");
    form.set("name", "Bulk review design note");
    form.set("sourceType", "figma_notes");
    form.set("url", "https://figma.example/file/demo");
    form.set("rawContent", "Bulk actions appear after eligible selection.");
    form.set("metadata", '{"fictional":true,"authority":"high"}');

    expect(parseSourceFormData(form)).toEqual({
      productId: "product-1",
      moduleId: "module-1",
      featureId: "feature-1",
      name: "Bulk review design note",
      sourceType: "figma_notes",
      url: "https://figma.example/file/demo",
      rawContent: "Bulk actions appear after eligible selection.",
      metadata: { fictional: true, authority: "high" },
    });
  });

  it("rejects invalid source metadata", () => {
    const form = new FormData();
    form.set("productId", "product-1");
    form.set("name", "Invalid metadata");
    form.set("sourceType", "note");
    form.set("rawContent", "Some source text.");
    form.set("metadata", "[1,2,3]");

    expect(() => parseSourceFormData(form)).toThrow("Metadata must be a JSON object");
  });

  it("keeps supported source types explicit for display", () => {
    expect(sourceTypes).toContain("jira_ticket");
    expect(sourceTypes).toContain("design_system_doc");
    expect(isSupportedSourceType("slack_summary")).toBe(true);
    expect(isSupportedSourceType("adr")).toBe(false);
    expect(getSourceTypeLabel("figma_notes")).toBe("Figma notes");
  });

  it("builds stable source routes and extraction input", () => {
    expect(sourceRoute("product-1", "source-1")).toBe(
      "/products/product-1/sources/source-1",
    );

    expect(
      buildSourceExtractionInput({
        id: "source-1",
        productId: "product-1",
        moduleId: "module-1",
        featureId: "feature-1",
        sourceType: "prd",
        name: "Approval requirement",
        url: null,
        rawContent: "Only assigned reviewers can approve.",
        metadata: { fictional: true },
      }),
    ).toEqual({
      sourceId: "source-1",
      productId: "product-1",
      moduleId: "module-1",
      featureId: "feature-1",
      sourceType: "prd",
      name: "Approval requirement",
      url: null,
      rawContent: "Only assigned reviewers can approve.",
      metadata: { fictional: true },
    });
  });

  it("keeps seed source data fictional and linked to knowledge evidence", () => {
    expect(seedSources).toHaveLength(6);
    expect(seedSources.map((source) => source.key)).toEqual([
      "progress-reporting-requirements-note",
      "bulk-review-design-critique-note",
      "bulk-operations-engineering-constraint-note",
      "reviewer-research-summary",
      "nextzen-release-2026-06-note",
      "design-system-bulk-pattern-note",
    ]);

    const sourceKeys: Set<string> = new Set(seedSources.map((source) => source.key));

    for (const source of seedSources) {
      expect(source.metadata.fictional).toBe(true);
      expect(isSupportedSourceType(source.sourceType)).toBe(true);
      expect(source.rawContent).not.toMatch(/lorem ipsum/i);
    }

    for (const item of seedKnowledge) {
      for (const sourceKey of item.sourceKeys) {
        expect(sourceKeys.has(sourceKey)).toBe(true);
      }
    }
  });

  it("requires authorization before source access", () => {
    expect(() => requireUserId("")).toThrow("Authenticated user id");
    expect(() => requireUserId("user-1")).not.toThrow();
  });
});
