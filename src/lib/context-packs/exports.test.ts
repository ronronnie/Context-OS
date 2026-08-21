import { describe, expect, it } from "vitest";

import {
  contextPackExportModes,
  formatContextPackExport,
  getContextPackExportFilename,
  type ContextPackExportData,
} from "@/lib/context-packs/exports";

describe("Context Pack export modes", () => {
  it("formats every supported export mode with usable output", () => {
    for (const mode of contextPackExportModes) {
      const output = formatContextPackExport(mode, exportData());

      expect(output.length).toBeGreaterThan(200);
      expect(output).toContain("Add bulk approval");
      expect(output).toContain("Approval permissions are role-limited");
    }
  });

  it("includes required Codex build prompt sections", () => {
    const output = formatContextPackExport("codex", exportData());

    expect(output).toContain("# Codex Build Prompt");
    expect(output).toContain("## Relevant Feature Context");
    expect(output).toContain("## Existing Patterns To Preserve");
    expect(output).toContain("## Files Or Components To Inspect When Known");
    expect(output).toContain("Avoid unrelated refactors");
    expect(output).toContain("Run lint, typecheck, tests, and production build");
  });

  it("includes required Claude design prompt sections", () => {
    const output = formatContextPackExport("claude", exportData());

    expect(output).toContain("# Claude Design Prompt");
    expect(output).toContain("## User Roles");
    expect(output).toContain("## Existing UX Behavior");
    expect(output).toContain("## Related Figma Links");
    expect(output).toContain("## Suggested Design Brief");
  });

  it("includes required ChatGPT analysis prompt sections", () => {
    const output = formatContextPackExport("chatgpt", exportData());

    expect(output).toContain("# ChatGPT Analysis Prompt");
    expect(output).toContain("## Product Background");
    expect(output).toContain("## Conflicts");
    expect(output).toContain("## Decision History");
    expect(output).toContain("## Expected Output Shape");
  });

  it("keeps plain Markdown as the stored Context Pack", () => {
    expect(formatContextPackExport("markdown", exportData())).toBe(
      exportData().pack.generatedContent,
    );
  });

  it("builds stable markdown download filenames", () => {
    expect(getContextPackExportFilename("codex", exportData())).toBe(
      "add-bulk-approval-v2-codex.md",
    );
  });
});

function exportData(): ContextPackExportData {
  return {
    pack: {
      id: "pack",
      version: 2,
      generatedContent:
        "# Context Pack\n\n## Task\nTitle: Add bulk approval\nDescription: I want to add bulk approval to Progress Report Review.\n\n## Product / Module / Feature\nProduct: Nextzen Demo\nModule: Progress Reporting\nFeature: Review Progress Report\n\n## Permissions\n- Approval permissions are role-limited.\n\n## Source Evidence\n- Progress report approval requirement (prd)",
    },
    task: {
      title: "Add bulk approval",
      description: "I want to add bulk approval to Progress Report Review.",
      status: "packed",
    },
    product: {
      name: "Nextzen Demo",
      description: "Fictional progress reporting product.",
    },
    module: {
      name: "Progress Reporting",
      description: "Report workflows.",
    },
    feature: {
      name: "Review Progress Report",
      description: "Review submitted reports.",
    },
    items: [
      {
        title: "Approval permissions are role-limited",
        body: "Only Program Administrators and assigned Reviewers can approve reports.",
        knowledgeType: "permission",
        authority: "canonical",
        confidence: 96,
        lifecycleStatus: "verified",
        relevanceScore: 97,
        reasonForInclusion: "Relevant permission rule for the requested workflow.",
        evidence: [
          {
            name: "Progress report approval requirement",
            sourceType: "prd",
            url: null,
          },
        ],
      },
      {
        title: "BulkActionBar exists in Application Review",
        body: "BulkActionBar is already used by Application Review.",
        knowledgeType: "component",
        authority: "high",
        confidence: 87,
        lifecycleStatus: "verified",
        relevanceScore: 91,
        reasonForInclusion: "Relevant component pattern connected to the requested work.",
        evidence: [
          {
            name: "Bulk review design note",
            sourceType: "figma_notes",
            url: "https://figma.example/file",
          },
        ],
      },
      {
        title: "Permanent bulk toolbar was rejected",
        body: "A permanently visible bulk toolbar was rejected.",
        knowledgeType: "rejected_approach",
        authority: "high",
        confidence: 90,
        lifecycleStatus: "rejected",
        relevanceScore: 88,
        reasonForInclusion:
          "Rejected historical approach that contradicts persistent controls.",
        evidence: [
          {
            name: "Old rejected bulk toolbar exploration",
            sourceType: "research_note",
            url: null,
          },
        ],
      },
    ],
  };
}
