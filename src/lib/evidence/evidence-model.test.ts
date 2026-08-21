import { describe, expect, it } from "vitest";

import type { Source } from "@/db/schema";
import {
  buildEvidenceDisplay,
  formatSourceEvidenceReference,
  getTrustLabel,
} from "@/lib/evidence/evidence-model";

describe("evidence model", () => {
  it("renders inspectable source evidence with fallback authority", () => {
    const source = sourceRecord({
      metadata: { excerpt: " A   concise   source excerpt. " },
      rawContent: "Long raw content that should not win.",
    });

    expect(buildEvidenceDisplay(source, "high")).toMatchObject({
      sourceId: "source-1",
      sourceType: "prd",
      sourceName: "Approval PRD",
      sourceUrl: "https://example.com/prd",
      evidenceText: "A concise source excerpt.",
      authority: "high",
    });
  });

  it("formats source references for Context Packs", () => {
    const reference = formatSourceEvidenceReference(sourceRecord());

    expect(reference).toContain("Approval PRD (prd, created");
    expect(reference).toContain("source date 2026-04-18");
    expect(reference).toContain("https://example.com/prd");
  });

  it("uses explicit trust labels", () => {
    expect(getTrustLabel({ lifecycleStatus: "verified", authority: "canonical" }))
      .toBe("Canonical");
    expect(getTrustLabel({ lifecycleStatus: "proposed", authority: "medium" }))
      .toBe("Proposed");
    expect(getTrustLabel({ lifecycleStatus: "outdated", authority: "high" }))
      .toBe("Outdated");
    expect(getTrustLabel({ lifecycleStatus: "rejected", authority: "high" }))
      .toBe("Rejected");
    expect(getTrustLabel({ lifecycleStatus: null, authority: "unverified" }))
      .toBe("Unverified");
  });
});

function sourceRecord(overrides: Partial<Source> = {}): Source {
  return {
    id: "source-1",
    productId: "product-1",
    moduleId: null,
    featureId: null,
    sourceType: "prd",
    name: "Approval PRD",
    url: "https://example.com/prd",
    rawContent: "Approval raw content.",
    metadata: { sourceDate: "2026-04-18" },
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    createdBy: "user-1",
    ...overrides,
  };
}
