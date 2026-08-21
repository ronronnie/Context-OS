import { z } from "zod";

export const featureRelationshipTypes = [
  "depends_on",
  "similar_to",
  "reuses_pattern_from",
  "blocks",
  "replaces",
  "impacts",
  "shares_component",
] as const;

export const knowledgeRelationshipTypes = [
  "supports",
  "contradicts",
  "supersedes",
  "duplicates",
  "explains",
  "constrains",
  "evidence_for",
  "related_to",
] as const;

export type FeatureRelationshipType = (typeof featureRelationshipTypes)[number];
export type KnowledgeRelationshipType = (typeof knowledgeRelationshipTypes)[number];

export const featureRelationshipOptions = featureRelationshipTypes.map((value) => ({
  value,
  label: formatRelationshipType(value),
}));

export const knowledgeRelationshipOptions = knowledgeRelationshipTypes.map((value) => ({
  value,
  label: formatRelationshipType(value),
}));

const featureRelationshipSchema = z.object({
  toFeatureId: z.string().uuid("Choose a valid related feature."),
  relationshipType: z.enum(featureRelationshipTypes),
  reason: z.string().trim().max(500, "Reason must be 500 characters or fewer."),
});

const knowledgeRelationshipSchema = z.object({
  toKnowledgeId: z.string().uuid("Choose a valid related memory."),
  relationshipType: z.enum(knowledgeRelationshipTypes),
  reason: z.string().trim().max(500, "Reason must be 500 characters or fewer."),
});

export function parseFeatureRelationshipFormData(formData: FormData) {
  return featureRelationshipSchema.parse({
    toFeatureId: formData.get("toFeatureId"),
    relationshipType: formData.get("relationshipType"),
    reason: formData.get("reason") ?? "",
  });
}

export function parseKnowledgeRelationshipFormData(formData: FormData) {
  return knowledgeRelationshipSchema.parse({
    toKnowledgeId: formData.get("toKnowledgeId"),
    relationshipType: formData.get("relationshipType"),
    reason: formData.get("reason") ?? "",
  });
}

export function formatRelationshipType(value: string) {
  return value.replaceAll("_", " ");
}

export function getGraphBucketForKnowledgeType(knowledgeType: string) {
  if (knowledgeType === "component") {
    return "components";
  }
  if (knowledgeType === "decision" || knowledgeType === "rejected_approach") {
    return "decisions";
  }
  if (
    knowledgeType === "business_rule" ||
    knowledgeType === "technical_constraint" ||
    knowledgeType === "permission" ||
    knowledgeType === "product_rule"
  ) {
    return "constraints";
  }

  return "memory";
}
