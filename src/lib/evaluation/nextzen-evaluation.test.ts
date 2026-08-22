import { describe, expect, it } from "vitest";

import {
  evaluateNextzenCase,
  formatEvaluationReport,
  nextzenEvaluationCases,
  runNextzenEvaluation,
} from "@/lib/evaluation/nextzen-evaluation";

describe("Nextzen evaluation harness", () => {
  it("defines the required regression cases", () => {
    expect(nextzenEvaluationCases.map((evaluationCase) => evaluationCase.title))
      .toEqual([
        "Add bulk approval to Progress Report Review",
        "Redesign report correction request flow",
        "Change confirmation modal pattern",
        "Increase bulk operation limit",
        "Compare Application Review and Progress Report Review",
        "Identify outdated bulk API knowledge",
        "Ask why persistent bulk toolbar should not be used",
      ]);
  });

  it("passes the deterministic Nextzen retrieval evaluation", () => {
    const summary = runNextzenEvaluation();

    expect(summary.passed).toBe(true);
    expect(summary.averageExpectedItemRecall).toBeGreaterThanOrEqual(0.75);
    expect(summary.averageSourceEvidenceCoverage).toBeGreaterThanOrEqual(0.8);
    expect(summary.totalUnexpectedItemCount).toBe(0);
    expect(summary.tenantIsolationPass).toBe(true);
  });

  it("rejects foreign tenant memory from selected Context Pack candidates", () => {
    const result = evaluateNextzenCase(nextzenEvaluationCases[0]);

    expect(result.tenantIsolationPass).toBe(true);
    expect(result.selectedTitles).not.toContain("Foreign tenant approval policy");
    expect(result.contextPack).not.toContain("Another customer's private approval policy");
  });

  it("surfaces source evidence and warnings in compiled Context Packs", () => {
    const bulkLimitCase = nextzenEvaluationCases.find(
      (evaluationCase) => evaluationCase.id === "outdated-bulk-api-knowledge",
    );

    expect(bulkLimitCase).toBeDefined();
    const result = evaluateNextzenCase(bulkLimitCase!);

    expect(result.selectedTitles).toContain("Old bulk API limit was 50 records");
    expect(result.surfacedWarnings).toContain("outdated");
    expect(result.contextPack).toContain("## Source Evidence");
    expect(result.contextPack).toContain("Bulk operations engineering constraint note");
    expect(result.contextPack).toContain("Outdated information was retrieved");
  });

  it("formats a readable terminal report", () => {
    const report = formatEvaluationReport(runNextzenEvaluation());

    expect(report).toContain("# Nextzen Evaluation Report");
    expect(report).toContain("Overall: PASS");
    expect(report).toContain("Tenant isolation: PASS");
  });
});
