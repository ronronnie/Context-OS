import { describe, expect, it, vi } from "vitest";

import type { AppDb } from "@/db";
import {
  approveDecisionCaptureCandidate,
  createTaskOutcomeForReview,
  getTaskOutcomeReview,
  rejectDecisionCaptureCandidate,
} from "@/db/queries/decision-capture";

describe("decision capture services", () => {
  it("requires authorization before creating a task outcome", async () => {
    const provider = {
      generateText: vi.fn(),
      generateStructuredOutput: vi.fn(),
      generateEmbedding: vi.fn(),
    };

    await expect(
      createTaskOutcomeForReview(
        "product-1",
        "pack-1",
        {
          summary: "Outcome",
          finalDecisionNotes: "",
          references: "",
          pastedOutcome: "Decision result.",
          moduleId: null,
          featureId: null,
        },
        "",
        provider,
        {} as AppDb,
      ),
    ).rejects.toThrow("Authenticated user id");
    expect(provider.generateStructuredOutput).not.toHaveBeenCalled();
  });

  it("requires authorization before reading a task outcome review", async () => {
    await expect(
      getTaskOutcomeReview(
        "product-1",
        "pack-1",
        "outcome-1",
        "",
        {} as AppDb,
      ),
    ).rejects.toThrow("Authenticated user id");
  });

  it("requires authorization before approving or rejecting candidates", async () => {
    await expect(
      approveDecisionCaptureCandidate(
        "product-1",
        "pack-1",
        "outcome-1",
        "candidate-1",
        {
          title: "Decision",
          body: "Decision body.",
          knowledgeType: "decision",
          authority: "high",
          confidence: 90,
          reasoningSummary: "Reviewed.",
          sourceEvidence: [
            { sourceId: "source-1", supportingText: "Decision body." },
          ],
          potentialRelationships: [],
          possibleConflicts: [],
          relatedKnowledgeId: null,
          relationshipType: "related_to",
          relationshipReason: "",
        },
        "",
        {} as AppDb,
      ),
    ).rejects.toThrow("Authenticated user id");

    await expect(
      rejectDecisionCaptureCandidate(
        "product-1",
        "pack-1",
        "outcome-1",
        "candidate-1",
        "",
        {} as AppDb,
      ),
    ).rejects.toThrow("Authenticated user id");
  });
});
