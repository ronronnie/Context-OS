import { z } from "zod";

const nullableDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? new Date(value) : null));

const knowledgeFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  body: z.string().trim().min(1, "Body is required."),
  knowledgeType: z.enum([
    "current_behaviour",
    "product_rule",
    "business_rule",
    "ux_pattern",
    "technical_constraint",
    "permission",
    "decision",
    "rejected_approach",
    "known_issue",
    "research_insight",
    "component",
    "terminology",
  ]),
  authority: z.enum(["canonical", "high", "medium", "low", "unverified"]),
  confidence: z.coerce.number().int().min(0).max(100),
  lifecycleStatus: z.enum(["proposed", "verified", "outdated", "rejected"]),
  validFrom: nullableDate,
  validUntil: nullableDate,
  lastVerifiedAt: nullableDate,
  confirmRejected: z
    .union([z.literal("on"), z.literal("true"), z.literal("yes")])
    .optional(),
});

export function parseKnowledgeFormData(formData: FormData) {
  const parsed = knowledgeFormSchema.parse(Object.fromEntries(formData));
  return {
    ...parsed,
    confirmedRejected: Boolean(parsed.confirmRejected),
    sourceIds: parseSourceIds(formData),
  };
}

export function parseLifecycleTransitionFormData(formData: FormData) {
  const targetStatus = z
    .enum(["proposed", "verified", "outdated", "rejected"])
    .parse(formData.get("targetStatus"));

  return {
    targetStatus,
    confirmedRejected: formData.get("confirmRejected") === "on",
  };
}

export function parseSourceIds(formData: FormData) {
  return formData
    .getAll("sourceIds")
    .map(String)
    .filter(Boolean);
}
