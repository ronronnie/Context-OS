import type { Feature, Module, Product, Source } from "@/db/schema";
import type { RankedRetrievalResult } from "@/lib/retrieval/hybrid-ranking";

export type ContextPackTaskInput = {
  title: string;
  description: string;
  taskIntent: string;
};

export type ContextPackMemoryResult = RankedRetrievalResult & {
  sources: Source[];
};

export type CompileContextPackInput = {
  task: ContextPackTaskInput;
  product: Product;
  module?: Module | null;
  feature?: Feature | null;
  results: ContextPackMemoryResult[];
};

const sectionConfig = [
  {
    title: "Current Behavior",
    types: ["current_behaviour"] as const,
  },
  {
    title: "Relevant Product Rules",
    types: ["product_rule", "business_rule"] as const,
  },
  {
    title: "Permissions",
    types: ["permission"] as const,
  },
  {
    title: "UX Patterns",
    types: ["ux_pattern"] as const,
  },
  {
    title: "Technical Constraints",
    types: ["technical_constraint"] as const,
  },
  {
    title: "Relevant Components",
    types: ["component"] as const,
  },
  {
    title: "Decisions",
    types: ["decision"] as const,
  },
  {
    title: "Rejected Approaches",
    types: ["rejected_approach"] as const,
  },
  {
    title: "Known Issues",
    types: ["known_issue", "open_question"] as const,
  },
] as const;

export function compileContextPack(input: CompileContextPackInput) {
  const lines = [
    "# Context Pack",
    "",
    "## Task",
    `Title: ${input.task.title}`,
    `Intent: ${input.task.taskIntent}`,
    `Description: ${input.task.description}`,
    "",
    "## Product / Module / Feature",
    `Product: ${input.product.name}`,
    input.module ? `Module: ${input.module.name}` : "Module: Not specified",
    input.feature ? `Feature: ${input.feature.name}` : "Feature: Not specified",
    "",
  ];

  for (const section of sectionConfig) {
    lines.push(`## ${section.title}`);
    lines.push(...renderMemoryItems(
      input.results.filter((result) =>
        section.types.includes(result.knowledgeItem.knowledgeType as never),
      ),
    ));
    lines.push("");
  }

  lines.push("## Related Features");
  lines.push(...renderRelatedFeatureNotes(input.results));
  lines.push("");
  lines.push("## Source Evidence");
  lines.push(...renderSourceEvidence(input.results));
  lines.push("");
  lines.push("## Open Questions");
  lines.push(...renderOpenQuestions(input.results));
  lines.push("");
  lines.push("## Suggested Prompt");
  lines.push(renderSuggestedPrompt(input));

  return lines.join("\n").trimEnd();
}

export function getContextPackMetadata(input: CompileContextPackInput) {
  return {
    taskIntent: input.task.taskIntent,
    productName: input.product.name,
    moduleName: input.module?.name ?? null,
    featureName: input.feature?.name ?? null,
    generatedAt: new Date().toISOString(),
    sectionCount: sectionConfig.length + 5,
    includedKnowledgeIds: input.results.map((result) => result.knowledgeItem.id),
  };
}

function renderMemoryItems(results: ContextPackMemoryResult[]) {
  if (!results.length) {
    return ["No relevant memory retrieved for this section."];
  }

  return results.map((result) => {
    const item = result.knowledgeItem;
    const lifecycle =
      item.lifecycleStatus === "outdated"
        ? " OUTDATED"
        : item.lifecycleStatus === "rejected"
          ? " REJECTED/HISTORICAL"
          : "";
    const evidence = formatEvidence(result.sources);
    const relation = result.relationshipPath
      ? ` Relationship: ${result.relationshipPath}.`
      : "";

    return [
      `- ${item.title}${lifecycle}: ${item.body}`,
      `  Authority: ${item.authority}; confidence: ${item.confidence}%; relevance: ${Math.round(result.finalScore * 100)}%.`,
      `  Why included: ${result.reasonForInclusion}${relation}`,
      `  Evidence: ${evidence}`,
    ].join("\n");
  });
}

function renderRelatedFeatureNotes(results: ContextPackMemoryResult[]) {
  const related = results
    .filter((result) => result.relationshipPath)
    .map((result) => `- ${result.knowledgeItem.title}: ${result.relationshipPath}`);

  return related.length ? related : ["No Product Graph relationship paths were retrieved."];
}

function renderSourceEvidence(results: ContextPackMemoryResult[]) {
  const sourceMap = new Map<string, Source>();
  for (const result of results) {
    for (const source of result.sources) {
      sourceMap.set(source.id, source);
    }
  }

  if (!sourceMap.size) {
    return ["No linked source evidence was retrieved."];
  }

  return Array.from(sourceMap.values()).map((source) => {
    const date = getSourceDate(source.metadata);
    return `- ${source.name} (${source.sourceType}${date ? `, ${date}` : ""})`;
  });
}

function renderOpenQuestions(results: ContextPackMemoryResult[]) {
  const hasLowEvidence = results.some((result) => !result.sources.length);
  const hasOutdated = results.some(
    (result) => result.knowledgeItem.lifecycleStatus === "outdated",
  );
  const hasContradictions = results.some((result) =>
    String(result.relationshipPath ?? "").includes("contradicts"),
  );
  const questions = [];

  if (hasLowEvidence) {
    questions.push("- Some included memory has no linked source evidence.");
  }
  if (hasOutdated) {
    questions.push("- Outdated information was retrieved; confirm whether it still applies.");
  }
  if (hasContradictions) {
    questions.push("- Contradictory memory exists; resolve it before making irreversible changes.");
  }

  return questions.length ? questions : ["No open questions detected from retrieved memory."];
}

function renderSuggestedPrompt(input: CompileContextPackInput) {
  return [
    `Use this Context Pack to work on: ${input.task.title}.`,
    `Task intent: ${input.task.taskIntent}.`,
    "Respect current verified Product Memory, cite source-backed constraints, preserve rejected approaches as historical context, and call out contradictions or open questions before proposing changes.",
    `User request: ${input.task.description}`,
  ].join(" ");
}

function formatEvidence(sources: Source[]) {
  if (!sources.length) {
    return "No linked source evidence.";
  }

  return sources.map((source) => source.name).join("; ");
}

function getSourceDate(metadata: Source["metadata"]) {
  const value = metadata["sourceDate"] ?? metadata["rejectedAt"];
  return typeof value === "string" ? value : null;
}
