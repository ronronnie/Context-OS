import { z } from "zod";

import {
  authorityOptions,
  knowledgeTypeOptions,
  lifecycleStatusOptions,
} from "@/lib/product-memory/knowledge-model";
import { sourceTypes } from "@/lib/source-ingestion/source-model";

const knowledgeFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  moduleId: z.string().uuid().optional(),
  featureId: z.string().uuid().optional(),
  knowledgeType: z.enum(
    knowledgeTypeOptions.map((option) => option.value) as [
      (typeof knowledgeTypeOptions)[number]["value"],
      ...(typeof knowledgeTypeOptions)[number]["value"][],
    ],
  ).optional(),
  lifecycleStatus: z.enum(
    lifecycleStatusOptions.map((option) => option.value) as [
      (typeof lifecycleStatusOptions)[number]["value"],
      ...(typeof lifecycleStatusOptions)[number]["value"][],
    ],
  ).optional(),
  authority: z.enum(
    authorityOptions.map((option) => option.value) as [
      (typeof authorityOptions)[number]["value"],
      ...(typeof authorityOptions)[number]["value"][],
    ],
  ).optional(),
});

const sourceFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  moduleId: z.string().uuid().optional(),
  featureId: z.string().uuid().optional(),
  sourceType: z.enum(sourceTypes).optional(),
});

export type KnowledgeLibraryFilters = z.infer<typeof knowledgeFilterSchema>;
export type SourceLibraryFilters = z.infer<typeof sourceFilterSchema>;

export function parseKnowledgeFilters(
  params: Record<string, string | string[] | undefined>,
): KnowledgeLibraryFilters {
  return knowledgeFilterSchema.parse({
    productId: normalizeParam(params.productId),
    moduleId: normalizeParam(params.moduleId),
    featureId: normalizeParam(params.featureId),
    knowledgeType: normalizeParam(params.knowledgeType),
    lifecycleStatus: normalizeParam(params.lifecycleStatus),
    authority: normalizeParam(params.authority),
  });
}

export function parseSourceFilters(
  params: Record<string, string | string[] | undefined>,
): SourceLibraryFilters {
  return sourceFilterSchema.parse({
    productId: normalizeParam(params.productId),
    moduleId: normalizeParam(params.moduleId),
    featureId: normalizeParam(params.featureId),
    sourceType: normalizeParam(params.sourceType),
  });
}

export function hasActiveKnowledgeFilters(filters: KnowledgeLibraryFilters) {
  return Object.values(filters).some(Boolean);
}

export function hasActiveSourceFilters(filters: SourceLibraryFilters) {
  return Object.values(filters).some(Boolean);
}

function normalizeParam(value: string | string[] | undefined) {
  const current = Array.isArray(value) ? value[0] : value;
  return current?.trim() || undefined;
}
