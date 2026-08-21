export const contextPackExportModes = [
  "codex",
  "claude",
  "chatgpt",
  "markdown",
] as const;

export type ContextPackExportMode = (typeof contextPackExportModes)[number];

export const contextPackExportModeLabels: Record<ContextPackExportMode, string> = {
  codex: "Codex build prompt",
  claude: "Claude design prompt",
  chatgpt: "ChatGPT analysis prompt",
  markdown: "Plain Markdown",
};

export type ContextPackExportData = {
  pack: {
    id: string;
    version: number;
    generatedContent: string;
  };
  task: {
    title: string;
    description: string;
    status: string;
  };
  product: {
    name: string;
    description: string;
  };
  module?: {
    name: string;
    description: string;
  } | null;
  feature?: {
    name: string;
    description: string;
  } | null;
  items: ContextPackExportItem[];
};

export type ContextPackExportItem = {
  title: string;
  body: string;
  knowledgeType: string;
  authority: string;
  confidence: number;
  lifecycleStatus: string;
  relevanceScore: number | null;
  reasonForInclusion: string | null;
  evidence: Array<{
    name: string;
    sourceType: string;
    url: string | null;
    createdAt: string;
    evidenceText: string;
  }>;
};

export function formatContextPackExport(
  mode: ContextPackExportMode,
  data: ContextPackExportData,
) {
  switch (mode) {
    case "codex":
      return formatCodexExport(data);
    case "claude":
      return formatClaudeExport(data);
    case "chatgpt":
      return formatChatGPTExport(data);
    case "markdown":
      return data.pack.generatedContent;
  }
}

export function getContextPackExportFilename(
  mode: ContextPackExportMode,
  data: Pick<ContextPackExportData, "pack" | "task">,
) {
  const safeTitle = data.task.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64) || "context-pack";

  return `${safeTitle}-v${data.pack.version}-${mode}.md`;
}

function formatCodexExport(data: ContextPackExportData) {
  return [
    "# Codex Build Prompt",
    "",
    "## Task",
    `Build task: ${data.task.title}`,
    data.task.description,
    "",
    "## Relevant Feature Context",
    renderProductScope(data),
    "",
    "## Constraints",
    renderItems(data.items, [
      "product_rule",
      "business_rule",
      "permission",
      "technical_constraint",
    ]),
    "",
    "## Existing Patterns To Preserve",
    renderItems(data.items, ["ux_pattern", "component"]),
    "",
    "## Technical Constraints",
    renderItems(data.items, ["technical_constraint"]),
    "",
    "## Files Or Components To Inspect When Known",
    renderComponentInspectionHints(data.items),
    "",
    "## Source-Backed Decisions",
    renderItems(data.items, ["decision", "rejected_approach"]),
    "",
    "## Acceptance Criteria",
    "- Preserve verified current behavior unless explicitly changing it.",
    "- Keep source-backed constraints visible in the implementation plan.",
    "- Surface contradictions, outdated memory, and rejected approaches before coding.",
    "- Avoid unrelated refactors.",
    "- Run lint, typecheck, tests, and production build before finishing.",
    "",
    "## Full Context Pack",
    data.pack.generatedContent,
  ].join("\n");
}

function formatClaudeExport(data: ContextPackExportData) {
  return [
    "# Claude Design Prompt",
    "",
    "## Task",
    data.task.title,
    data.task.description,
    "",
    "## User Roles",
    renderItems(data.items, ["permission", "business_rule"]),
    "",
    "## Existing UX Behavior",
    renderItems(data.items, ["current_behaviour"]),
    "",
    "## Design Patterns",
    renderItems(data.items, ["ux_pattern"]),
    "",
    "## Components",
    renderItems(data.items, ["component"]),
    "",
    "## Related Figma Links",
    renderFigmaEvidence(data.items),
    "",
    "## Product Rules",
    renderItems(data.items, ["product_rule", "business_rule", "permission"]),
    "",
    "## Known Issues",
    renderItems(data.items, ["known_issue", "open_question"]),
    "",
    "## Rejected Approaches",
    renderItems(data.items, ["rejected_approach"]),
    "",
    "## Open Questions",
    renderOpenQuestions(data.items),
    "",
    "## Suggested Design Brief",
    `Design ${data.task.title} for ${data.product.name}. Preserve existing behavior and patterns, call out constraints, and use rejected approaches as boundaries for what not to propose.`,
  ].join("\n");
}

function formatChatGPTExport(data: ContextPackExportData) {
  return [
    "# ChatGPT Analysis Prompt",
    "",
    "## Product Background",
    `${data.product.name}: ${data.product.description || "No product description provided."}`,
    renderProductScope(data),
    "",
    "## Task",
    `${data.task.title}: ${data.task.description}`,
    "",
    "## Relevant Memory",
    renderItems(data.items, [
      "current_behaviour",
      "product_rule",
      "business_rule",
      "ux_pattern",
      "technical_constraint",
      "permission",
      "component",
      "known_issue",
      "open_question",
    ]),
    "",
    "## Conflicts",
    renderConflictNotes(data.items),
    "",
    "## Decision History",
    renderItems(data.items, ["decision", "rejected_approach"]),
    "",
    "## Source Evidence",
    renderAllEvidence(data.items),
    "",
    "## Questions To Answer",
    "- What Product Memory is most important for this task?",
    "- What constraints or decisions limit the solution space?",
    "- What contradictions, outdated information, or rejected approaches should be surfaced?",
    "- What should the next implementation or design step be?",
    "",
    "## Expected Output Shape",
    "- Brief synthesis",
    "- Key constraints",
    "- Recommended approach",
    "- Risks and open questions",
    "- Source-backed rationale",
  ].join("\n");
}

function renderProductScope(data: ContextPackExportData) {
  return [
    `Product: ${data.product.name}`,
    `Module: ${data.module?.name ?? "Not specified"}`,
    `Feature: ${data.feature?.name ?? "Not specified"}`,
    data.feature?.description ? `Feature description: ${data.feature.description}` : "",
  ].filter(Boolean).join("\n");
}

function renderItems(items: ContextPackExportItem[], types: string[]) {
  const matching = items.filter((item) => types.includes(item.knowledgeType));

  if (!matching.length) {
    return "No retrieved memory for this section.";
  }

  return matching.map(renderItem).join("\n");
}

function renderItem(item: ContextPackExportItem) {
  const lifecycle =
    item.lifecycleStatus === "outdated"
      ? " OUTDATED"
      : item.lifecycleStatus === "rejected"
        ? " REJECTED/HISTORICAL"
        : "";
  const evidence = item.evidence.length
    ? item.evidence.map(renderEvidenceReference).join("; ")
    : "No linked source evidence.";

  return [
    `- ${item.title}${lifecycle}: ${item.body}`,
    `  Authority: ${item.authority}; confidence: ${item.confidence}%; relevance: ${item.relevanceScore ?? 0}%.`,
    item.reasonForInclusion ? `  Why included: ${item.reasonForInclusion}` : "",
    `  Evidence: ${evidence}`,
  ].filter(Boolean).join("\n");
}

function renderComponentInspectionHints(items: ContextPackExportItem[]) {
  const components = items.filter((item) => item.knowledgeType === "component");

  if (!components.length) {
    return "No known files or components were retrieved.";
  }

  return components.map((item) => `- Inspect component/pattern: ${item.title}`).join("\n");
}

function renderFigmaEvidence(items: ContextPackExportItem[]) {
  const figmaSources = items
    .flatMap((item) => item.evidence)
    .filter((source) => source.sourceType.includes("figma"));

  if (!figmaSources.length) {
    return "No related Figma links were retrieved.";
  }

  return figmaSources.map((source) => `- ${source.name}${source.url ? `: ${source.url}` : ""}`).join("\n");
}

function renderOpenQuestions(items: ContextPackExportItem[]) {
  const questions = [];
  if (items.some((item) => !item.evidence.length)) {
    questions.push("- Which retrieved claims need stronger source evidence?");
  }
  if (items.some((item) => item.lifecycleStatus === "outdated")) {
    questions.push("- Which outdated claims still matter for the current task?");
  }
  if (items.some((item) => item.lifecycleStatus === "rejected")) {
    questions.push("- Which rejected approaches should constrain the design direction?");
  }

  return questions.length ? questions.join("\n") : "No open questions detected.";
}

function renderConflictNotes(items: ContextPackExportItem[]) {
  const conflicts = items.filter((item) =>
    `${item.title} ${item.body} ${item.reasonForInclusion ?? ""}`
      .toLowerCase()
      .includes("contradict"),
  );

  return conflicts.length
    ? conflicts.map(renderItem).join("\n")
    : "No explicit contradictions were included in this pack.";
}

function renderAllEvidence(items: ContextPackExportItem[]) {
  const evidence = new Map<string, ContextPackExportItem["evidence"][number]>();
  for (const item of items) {
    for (const source of item.evidence) {
      evidence.set(`${source.sourceType}-${source.name}`, source);
    }
  }

  if (!evidence.size) {
    return "No linked source evidence was included.";
  }

  return Array.from(evidence.values())
    .map((source) => `- ${renderEvidenceReference(source)}`)
    .join("\n");
}

function renderEvidenceReference(source: ContextPackExportItem["evidence"][number]) {
  const url = source.url ? `, ${source.url}` : "";
  const excerpt = source.evidenceText ? ` Excerpt: ${source.evidenceText}` : "";

  return `${source.name} (${source.sourceType}, created ${source.createdAt}${url}).${excerpt}`;
}
