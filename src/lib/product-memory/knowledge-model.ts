import type {
  authorityEnum,
  knowledgeTypeEnum,
  lifecycleStatusEnum,
} from "@/db/schema/index";

export type KnowledgeType = (typeof knowledgeTypeEnum.enumValues)[number];
export type Authority = (typeof authorityEnum.enumValues)[number];
export type LifecycleStatus = (typeof lifecycleStatusEnum.enumValues)[number];

export const knowledgeTypeOptions: Array<{ value: KnowledgeType; label: string }> = [
  { value: "current_behaviour", label: "Current behavior" },
  { value: "product_rule", label: "Product rules" },
  { value: "business_rule", label: "Business rules" },
  { value: "ux_pattern", label: "UX patterns" },
  { value: "technical_constraint", label: "Technical constraints" },
  { value: "permission", label: "Permissions" },
  { value: "decision", label: "Decisions" },
  { value: "rejected_approach", label: "Rejected approaches" },
  { value: "known_issue", label: "Known issues" },
  { value: "open_question", label: "Open questions" },
  { value: "research_insight", label: "Research insights" },
  { value: "component", label: "Components" },
  { value: "terminology", label: "Terminology" },
];

export const authorityOptions: Array<{ value: Authority; label: string }> = [
  { value: "canonical", label: "Canonical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "unverified", label: "Unverified" },
];

export const lifecycleStatusOptions: Array<{
  value: LifecycleStatus;
  label: string;
}> = [
  { value: "proposed", label: "Proposed" },
  { value: "verified", label: "Verified" },
  { value: "outdated", label: "Outdated" },
  { value: "rejected", label: "Rejected" },
];

export function getKnowledgeTypeLabel(type: KnowledgeType) {
  return knowledgeTypeOptions.find((option) => option.value === type)?.label ?? type;
}

export function groupKnowledgeItemsByType<T extends { knowledgeType: KnowledgeType }>(
  items: T[],
) {
  const groups = Object.fromEntries(
    knowledgeTypeOptions.map((option) => [option.value, [] as T[]]),
  ) as Record<KnowledgeType, T[]>;

  for (const item of items) {
    groups[item.knowledgeType].push(item);
  }

  return groups;
}

export function getLifecycleEventType(
  type: KnowledgeType,
  status: LifecycleStatus,
) {
  if (status === "verified") {
    return "verified" as const;
  }
  if (status === "rejected" || type === "rejected_approach") {
    return "rejected_approach_added" as const;
  }
  if (type === "decision") {
    return "decision_added" as const;
  }
  return "created" as const;
}

export function validateLifecycleTransition({
  from,
  to,
  confirmed,
}: {
  from: LifecycleStatus;
  to: LifecycleStatus;
  confirmed?: boolean;
}) {
  if (from === to) {
    return true;
  }

  const allowed =
    (from === "proposed" && to === "verified") ||
    (from === "verified" && to === "outdated") ||
    (from === "proposed" && to === "rejected") ||
    (from === "verified" && to === "rejected" && confirmed === true);

  if (!allowed) {
    throw new Error(
      from === "verified" && to === "rejected"
        ? "Rejecting verified knowledge requires confirmation."
        : `Unsupported lifecycle transition: ${from} -> ${to}.`,
    );
  }

  return true;
}
