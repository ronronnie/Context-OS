import type { sources } from "@/db/schema/index";

export type SourceExtractionStatus = {
  status: "not_started";
  label: string;
  description: string;
};

export type SourceExtractionInput = {
  sourceId: string;
  productId: string;
  moduleId: string | null;
  featureId: string | null;
  sourceType: string;
  name: string;
  url: string | null;
  rawContent: string;
  metadata: Record<string, unknown>;
};

type SourceRecord = Pick<
  typeof sources.$inferSelect,
  | "id"
  | "productId"
  | "moduleId"
  | "featureId"
  | "sourceType"
  | "name"
  | "url"
  | "rawContent"
  | "metadata"
>;

export function buildSourceExtractionInput(
  source: SourceRecord,
): SourceExtractionInput {
  return {
    sourceId: source.id,
    productId: source.productId,
    moduleId: source.moduleId,
    featureId: source.featureId,
    sourceType: source.sourceType,
    name: source.name,
    url: source.url,
    rawContent: source.rawContent ?? "",
    metadata: source.metadata,
  };
}

export function getSourceExtractionStatus(): SourceExtractionStatus {
  return {
    status: "not_started",
    label: "Extraction not started",
    description:
      "Prompt 7 will call the source extraction service from this source record.",
  };
}
