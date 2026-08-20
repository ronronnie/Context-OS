import { describe, expect, it } from "vitest";

import { requireUserId } from "@/db/queries";
import type { sourceExtractionCandidates } from "@/db/schema/index";
import {
  type CandidateReviewEdits,
  candidateCanEnterProductMemory,
  candidateEvidenceIncludesSource,
  candidateToVerifiedKnowledgeInput,
  getCandidateReviewDisplay,
} from "@/lib/source-ingestion/review-model";

describe("source extraction review model", () => {
  it("renders candidate review data for the review screen", () => {
    expect(getCandidateReviewDisplay(candidate)).toEqual({
      title: "Approval requires assigned reviewer",
      type: "permission",
      suggestedAuthority: "high",
      confidenceLabel: "88% confidence",
      status: "pending",
      evidenceCount: 1,
      possibleConflictCount: 1,
    });
  });

  it("converts an approved candidate into verified Product Memory", () => {
    const input = candidateToVerifiedKnowledgeInput(candidate, edits);

    expect(input).toMatchObject({
      productId: "product-1",
      moduleId: "module-1",
      featureId: "feature-1",
      title: "Edited approval requirement",
      body: "Edited body before approval.",
      knowledgeType: "permission",
      authority: "canonical",
      confidence: 91,
      lifecycleStatus: "verified",
    });
    expect(input.lastVerifiedAt).toBeInstanceOf(Date);
  });

  it("keeps rejected and pending candidates out of Product Memory", () => {
    expect(candidateCanEnterProductMemory("approved")).toBe(true);
    expect(candidateCanEnterProductMemory("pending")).toBe(false);
    expect(candidateCanEnterProductMemory("rejected")).toBe(false);
  });

  it("preserves source evidence before approval", () => {
    expect(candidateEvidenceIncludesSource(edits, "source-1")).toBe(true);
    expect(candidateEvidenceIncludesSource(edits, "source-2")).toBe(false);
  });

  it("requires authorization before extraction review access", () => {
    expect(() => requireUserId("")).toThrow("Authenticated user id");
    expect(() => requireUserId("user-1")).not.toThrow();
  });
});

const candidate: typeof sourceExtractionCandidates.$inferSelect = {
  id: "candidate-1",
  extractionId: "extraction-1",
  productId: "product-1",
  sourceId: "source-1",
  moduleId: "module-1",
  featureId: "feature-1",
  title: "Approval requires assigned reviewer",
  body: "Only assigned reviewers can approve reports.",
  knowledgeType: "permission",
  suggestedAuthority: "high",
  confidence: 88,
  reasoningSummary: "The source states this as a permission constraint.",
  sourceEvidence: [
    {
      sourceId: "source-1",
      supportingText: "Only assigned reviewers can approve reports.",
    },
  ],
  potentialRelationships: ["Approve Progress Report"],
  appearsHistorical: false,
  possibleConflicts: ["Older reviewer notes mention managers."],
  status: "pending",
  approvedKnowledgeItemId: null,
  createdAt: new Date("2026-08-20T00:00:00Z"),
  updatedAt: new Date("2026-08-20T00:00:00Z"),
};

const edits: CandidateReviewEdits = {
  title: "Edited approval requirement",
  body: "Edited body before approval.",
  knowledgeType: "permission",
  authority: "canonical",
  confidence: 91,
  reasoningSummary: "Human clarified the candidate before approval.",
  sourceEvidence: [
    {
      sourceId: "source-1",
      supportingText: "Only assigned reviewers can approve reports.",
    },
  ],
  potentialRelationships: ["Approve Progress Report"],
  possibleConflicts: [],
};
