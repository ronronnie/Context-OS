import type { Source } from "@/db/schema";

export const figmaMetadataFields = [
  { key: "figmaFileKey", label: "File key" },
  { key: "figmaNodeId", label: "Node ID" },
  { key: "figmaUrl", label: "Figma URL" },
  { key: "figmaPageName", label: "Page" },
  { key: "figmaFrameName", label: "Frame" },
  { key: "componentName", label: "Component" },
] as const;

export type FigmaMetadataRow = {
  key: (typeof figmaMetadataFields)[number]["key"];
  label: string;
  value: string;
};

export function isFigmaSourceType(sourceType: string) {
  return sourceType === "figma_link" || sourceType === "figma_notes";
}

export function getFigmaSourceUrl(
  source: Pick<Source, "url" | "metadata">,
) {
  const figmaUrl = source.metadata["figmaUrl"];
  return typeof figmaUrl === "string" && figmaUrl.trim()
    ? figmaUrl
    : source.url;
}

export function getFigmaMetadataRows(metadata: Record<string, unknown>) {
  return figmaMetadataFields.reduce<FigmaMetadataRow[]>((rows, field) => {
    const value = metadata[field.key];

    if (typeof value === "string" && value.trim()) {
      rows.push({ ...field, value });
    }

    return rows;
  }, []);
}
