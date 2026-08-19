import type { DemoKnowledgeItem } from "@/lib/demo-data";

export type RankedKnowledgeItem = DemoKnowledgeItem & {
  score: number;
};

const statusWeight: Record<DemoKnowledgeItem["status"], number> = {
  verified: 1,
  needs_review: 0.72,
  draft: 0.45,
  superseded: 0.2,
};

const typeWeight: Record<DemoKnowledgeItem["type"], number> = {
  constraint: 1,
  decision: 0.94,
  current_state: 0.9,
  relationship: 0.86,
  pattern: 0.82,
  history: 0.74,
};

export function rankKnowledgeForTask(
  task: string,
  items: DemoKnowledgeItem[],
): RankedKnowledgeItem[] {
  const taskTerms = tokenize(task);

  return items
    .map((item) => {
      const searchable = tokenize(
        `${item.claim} ${item.module} ${item.feature} ${item.tags.join(" ")}`,
      );
      const lexicalScore = overlapScore(taskTerms, searchable);
      const authorityScore = (item.authority * 0.28 + item.recency * 0.17) *
        statusWeight[item.status];
      const memoryScore = typeWeight[item.type] * 0.18;

      return {
        ...item,
        score: Number((lexicalScore * 0.37 + authorityScore + memoryScore).toFixed(3)),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildContextPack(
  task: string,
  rankedItems: RankedKnowledgeItem[],
): string {
  const verified = rankedItems.filter((item) => item.status === "verified");
  const needsReview = rankedItems.filter((item) => item.status !== "verified");
  const sources = Array.from(new Set(rankedItems.flatMap((item) => item.sources)));

  return [
    "# Context Pack",
    "",
    `## Task`,
    task.trim(),
    "",
    "## Use This Context Before Working",
    ...verified.map(
      (item) =>
        `- [${item.type}] ${item.claim} Sources: ${item.sources.join(", ")}.`,
    ),
    "",
    "## Needs Human Attention",
    needsReview.length
      ? needsReview
          .map(
            (item) =>
              `- [${item.status}] ${item.claim} Sources: ${item.sources.join(", ")}.`,
          )
          .join("\n")
      : "- No unverified memory included in this pack.",
    "",
    "## Source IDs",
    sources.map((source) => `- ${source}`).join("\n"),
    "",
    "## Capture Back",
    "- After the AI task completes, record new decisions, rejected options, changed constraints, and source evidence back into Product Memory.",
  ].join("\n");
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 2),
  );
}

function overlapScore(taskTerms: Set<string>, itemTerms: Set<string>): number {
  if (taskTerms.size === 0) {
    return 0;
  }

  let matches = 0;
  for (const term of taskTerms) {
    if (itemTerms.has(term)) {
      matches += 1;
    }
  }

  return matches / taskTerms.size;
}
