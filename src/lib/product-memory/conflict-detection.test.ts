import { describe, expect, it } from "vitest";

import {
  canApproveCandidateWithConflicts,
  detectKnowledgeConflicts,
  getConflictResolutionEffect,
  historicalKnowledgeRemainsQueryable,
  type CandidateForConflict,
  type ExistingKnowledgeForConflict,
} from "@/lib/product-memory/conflict-detection";

describe("Product Memory conflict detection", () => {
  it("detects contradictions when product limits differ", () => {
    const [conflict] = detectKnowledgeConflicts(
      candidate({
        body: "Bulk operations support maximum 100 records.",
      }),
      [
        existing({
          body: "Bulk API supports maximum 50 records.",
        }),
      ],
    );

    expect(conflict.conflictType).toBe("contradiction");
    expect(conflict.summary).toContain("100");
    expect(conflict.summary).toContain("50");
  });

  it("detects superseded information when new wording presents an updated state", () => {
    const [conflict] = detectKnowledgeConflicts(
      candidate({
        body: "Bulk operations now support maximum 100 records.",
      }),
      [
        existing({
          body: "Bulk API supports maximum 50 records.",
        }),
      ],
    );

    expect(conflict.conflictType).toBe("supersedes");
  });

  it("detects duplicate candidate memory", () => {
    const [conflict] = detectKnowledgeConflicts(
      candidate({
        title: "Bulk actions require eligible selection",
        body: "Bulk actions appear only after at least one eligible record is selected.",
      }),
      [
        existing({
          title: "Bulk actions require eligible selection",
          body: "Bulk actions appear only after at least one eligible record is selected.",
          knowledgeType: "ux_pattern",
        }),
      ],
    );

    expect(conflict.conflictType).toBe("duplicate");
  });

  it("detects historical information presented as current", () => {
    const [conflict] = detectKnowledgeConflicts(
      candidate({
        body: "Bulk approval used a permanent toolbar during the 2025 exploration.",
        knowledgeType: "current_behaviour",
        appearsHistorical: true,
      }),
      [
        existing({
          body: "Bulk approval uses a contextual action bar in the current review flow.",
          knowledgeType: "current_behaviour",
        }),
      ],
    );

    expect(conflict.conflictType).toBe("historical_as_current");
  });

  it("detects lower-authority candidates conflicting with stronger memory", () => {
    const [conflict] = detectKnowledgeConflicts(
      candidate({
        title: "ConfirmationModal required",
        body: "ConfirmationModal is usually used before irreversible workflow changes.",
        suggestedAuthority: "low",
      }),
      [
        existing({
          title: "ConfirmationModal required",
          body: "ConfirmationModal is required before irreversible workflow changes.",
          authority: "canonical",
        }),
      ],
    );

    expect(conflict.conflictType).toBe("authority_mismatch");
  });

  it("requires conflict resolution before normal approval", () => {
    expect(canApproveCandidateWithConflicts(0)).toBe(true);
    expect(canApproveCandidateWithConflicts(1)).toBe(false);
  });

  it("models conflict review actions without deleting history", () => {
    expect(getConflictResolutionEffect("mark_existing_outdated")).toMatchObject({
      approveNew: true,
      markExistingOutdated: true,
      preservesExistingHistory: true,
    });
    expect(getConflictResolutionEffect("keep_both")).toMatchObject({
      approveNew: true,
      markExistingOutdated: false,
      relationshipType: "related_to",
    });
    expect(getConflictResolutionEffect("reject_new")).toMatchObject({
      approveNew: false,
      preservesExistingHistory: true,
    });
  });

  it("keeps historical memory queryable after it becomes outdated", () => {
    expect(historicalKnowledgeRemainsQueryable("outdated")).toBe(true);
    expect(historicalKnowledgeRemainsQueryable("verified")).toBe(true);
  });
});

function candidate(overrides: Partial<CandidateForConflict> = {}): CandidateForConflict {
  return {
    id: "candidate-1",
    title: "Bulk operation limit",
    body: "Bulk operations support maximum 100 records.",
    knowledgeType: "technical_constraint",
    suggestedAuthority: "high",
    confidence: 88,
    appearsHistorical: false,
    possibleConflicts: [],
    ...overrides,
  };
}

function existing(
  overrides: Partial<ExistingKnowledgeForConflict> = {},
): ExistingKnowledgeForConflict {
  return {
    id: "knowledge-1",
    title: "Bulk operation limit",
    body: "Bulk API supports maximum 50 records.",
    knowledgeType: "technical_constraint",
    authority: "high",
    lifecycleStatus: "verified",
    lastVerifiedAt: new Date("2025-01-01T00:00:00Z"),
    moduleId: "module-1",
    featureId: "feature-1",
    ...overrides,
  };
}
