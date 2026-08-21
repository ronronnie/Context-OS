import { describe, expect, it } from "vitest";

import type { decisionCaptureCandidates } from "@/db/schema/index";
import {
  buildTaskOutcomeSourceContent,
  decisionCandidateEvidenceIncludesSource,
  decisionCandidateToVerifiedKnowledgeInput,
  formatDecisionCandidateRelationships,
  parseDecisionCandidateReviewFormData,
  parseTaskOutcomeFormData,
} from "@/lib/decision-capture/model";

describe("decision capture model", () => {
  it("parses task outcome creation input and preserves pasted work", () => {
    const form = new FormData();
    form.set("summary", "Bulk approval decision captured");
    form.set("finalDecisionNotes", "Keep row-level errors visible.");
    form.set("references", "https://example.com/pr/1");
    form.set("pastedOutcome", "Final decision from Codex review.");
    form.set("moduleId", "module-1");
    form.set("featureId", "feature-1");

    expect(parseTaskOutcomeFormData(form)).toEqual({
      summary: "Bulk approval decision captured",
      finalDecisionNotes: "Keep row-level errors visible.",
      references: "https://example.com/pr/1",
      pastedOutcome: "Final decision from Codex review.",
      moduleId: "module-1",
      featureId: "feature-1",
    });
  });

  it("creates a source body for the task outcome evidence record", () => {
    const content = buildTaskOutcomeSourceContent({
      summary: "Bulk approval decision captured",
      finalDecisionNotes: "Keep row-level errors visible.",
      references: "https://example.com/pr/1",
      pastedOutcome: "Final decision from Codex review.",
      moduleId: "module-1",
      featureId: "feature-1",
    });

    expect(content).toContain("## Summary");
    expect(content).toContain("## Pasted result");
    expect(content).toContain("Final decision from Codex review.");
  });

  it("parses candidate review edits with source, task, and relationship metadata", () => {
    const form = new FormData();
    form.set("title", "Bulk approval keeps row-level errors");
    form.set("body", "Bulk approval keeps row-level errors visible.");
    form.set("knowledgeType", "decision");
    form.set("authority", "high");
    form.set("confidence", "91");
    form.set("reasoningSummary", "Human confirmed final decision.");
    form.set(
      "sourceEvidence",
      JSON.stringify([
        {
          sourceId: "source-1",
          supportingText: "Keep row-level errors visible.",
        },
      ]),
    );
    form.set("potentialRelationships", "related_to:existing-1");
    form.set("possibleConflicts", "Older discussion proposed hiding errors.");
    form.set("relatedKnowledgeId", "existing-1");
    form.set("relationshipType", "supersedes");
    form.set("relationshipReason", "Final task outcome supersedes old exploration.");

    expect(parseDecisionCandidateReviewFormData(form)).toMatchObject({
      title: "Bulk approval keeps row-level errors",
      knowledgeType: "decision",
      authority: "high",
      confidence: 91,
      potentialRelationships: ["related_to:existing-1"],
      possibleConflicts: ["Older discussion proposed hiding errors."],
      relatedKnowledgeId: "existing-1",
      relationshipType: "supersedes",
    });
  });

  it("requires approved candidates to preserve outcome source evidence", () => {
    const edits = parseDecisionCandidateReviewFormData(reviewForm());

    expect(decisionCandidateEvidenceIncludesSource(edits, "source-1")).toBe(true);
    expect(decisionCandidateEvidenceIncludesSource(edits, "other-source")).toBe(false);
  });

  it("maps approved candidates to verified Product Memory inputs", () => {
    const edits = parseDecisionCandidateReviewFormData(reviewForm());
    const input = decisionCandidateToVerifiedKnowledgeInput(candidate, edits);

    expect(input).toMatchObject({
      productId: "product-1",
      moduleId: "module-1",
      featureId: "feature-1",
      title: "Bulk approval keeps row-level errors",
      knowledgeType: "decision",
      authority: "high",
      lifecycleStatus: "verified",
    });
    expect(input.lastVerifiedAt).toBeInstanceOf(Date);
  });

  it("keeps AI-suggested relationships explicit for human review", () => {
    expect(
      formatDecisionCandidateRelationships({
        relevantOldKnowledgeIds: ["existing-1"],
        supersededKnowledgeIds: ["existing-2"],
      }),
    ).toEqual(["related_to:existing-1", "supersedes:existing-2"]);
  });
});

const candidate = {
  id: "candidate-1",
  outcomeId: "outcome-1",
  productId: "product-1",
  taskId: "task-1",
  contextPackId: "pack-1",
  sourceId: "source-1",
  moduleId: "module-1",
  featureId: "feature-1",
  title: "Bulk approval keeps row-level errors",
  body: "Bulk approval keeps row-level errors visible.",
  knowledgeType: "decision",
  suggestedAuthority: "high",
  confidence: 91,
  reasoningSummary: "Human confirmed final decision.",
  sourceEvidence: [
    { sourceId: "source-1", supportingText: "Keep row-level errors visible." },
  ],
  potentialRelationships: ["related_to:existing-1"],
  possibleConflicts: [],
  status: "pending",
  approvedKnowledgeItemId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies typeof decisionCaptureCandidates.$inferSelect;

function reviewForm() {
  const form = new FormData();
  form.set("title", "Bulk approval keeps row-level errors");
  form.set("body", "Bulk approval keeps row-level errors visible.");
  form.set("knowledgeType", "decision");
  form.set("authority", "high");
  form.set("confidence", "91");
  form.set("reasoningSummary", "Human confirmed final decision.");
  form.set(
    "sourceEvidence",
    JSON.stringify([
      { sourceId: "source-1", supportingText: "Keep row-level errors visible." },
    ]),
  );

  return form;
}
