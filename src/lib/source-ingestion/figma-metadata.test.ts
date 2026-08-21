import { describe, expect, it } from "vitest";

import type { Source } from "@/db/schema";
import {
  getFigmaMetadataRows,
  getFigmaSourceUrl,
  isFigmaSourceType,
} from "@/lib/source-ingestion/figma-metadata";

describe("Figma source metadata", () => {
  it("detects manual Figma source types", () => {
    expect(isFigmaSourceType("figma_link")).toBe(true);
    expect(isFigmaSourceType("figma_notes")).toBe(true);
    expect(isFigmaSourceType("prd")).toBe(false);
  });

  it("renders only populated Figma metadata rows", () => {
    expect(
      getFigmaMetadataRows({
        figmaFileKey: "abc123",
        figmaNodeId: "12:34",
        figmaPageName: "",
        componentName: "BulkActionBar",
        ignored: "value",
      }),
    ).toEqual([
      { key: "figmaFileKey", label: "File key", value: "abc123" },
      { key: "figmaNodeId", label: "Node ID", value: "12:34" },
      { key: "componentName", label: "Component", value: "BulkActionBar" },
    ]);
  });

  it("prefers figmaUrl metadata over the generic source URL", () => {
    expect(
      getFigmaSourceUrl(
        sourceRecord({
          url: "https://figma.example/generic",
          metadata: { figmaUrl: "https://figma.example/node" },
        }),
      ),
    ).toBe("https://figma.example/node");

    expect(getFigmaSourceUrl(sourceRecord({ metadata: {} }))).toBe(
      "https://figma.example/generic",
    );
  });
});

function sourceRecord(overrides: Partial<Source> = {}): Source {
  return {
    id: "source-1",
    productId: "product-1",
    moduleId: null,
    featureId: null,
    sourceType: "figma_link",
    name: "Bulk action frame",
    url: "https://figma.example/generic",
    rawContent: "Manual Figma note.",
    metadata: {},
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    createdBy: "user-1",
    ...overrides,
  };
}
