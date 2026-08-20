export const sourceTypes = [
  "note",
  "prd",
  "jira_ticket",
  "figma_link",
  "figma_notes",
  "research_note",
  "release_note",
  "slack_summary",
  "code_note",
  "design_system_doc",
  "meeting_note",
] as const;

export type SourceType = (typeof sourceTypes)[number];

export const sourceTypeOptions: Array<{ value: SourceType; label: string }> = [
  { value: "note", label: "Note" },
  { value: "prd", label: "PRD" },
  { value: "jira_ticket", label: "Jira ticket" },
  { value: "figma_link", label: "Figma link" },
  { value: "figma_notes", label: "Figma notes" },
  { value: "research_note", label: "Research note" },
  { value: "release_note", label: "Release note" },
  { value: "slack_summary", label: "Slack summary" },
  { value: "code_note", label: "Code note" },
  { value: "design_system_doc", label: "Design system doc" },
  { value: "meeting_note", label: "Meeting note" },
];

const sourceTypeLabels = new Map(
  sourceTypeOptions.map((option) => [option.value, option.label]),
);

export function getSourceTypeLabel(sourceType: string) {
  return sourceTypeLabels.get(sourceType as SourceType) ?? sourceType;
}

export function isSupportedSourceType(sourceType: string): sourceType is SourceType {
  return sourceTypeLabels.has(sourceType as SourceType);
}
