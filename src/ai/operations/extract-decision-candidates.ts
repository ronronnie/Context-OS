import { AIMalformedResponseError } from "@/ai/errors";
import { buildDecisionCapturePrompts, type DecisionCapturePromptInput } from "@/ai/prompts/decision-capture";
import type { AIProvider } from "@/ai/provider";
import { createAIProvider } from "@/ai/provider";
import {
  decisionCaptureExtractionSchema,
  type DecisionCaptureExtraction,
} from "@/ai/schemas/decision-capture";

export async function extractDecisionCandidates(
  input: DecisionCapturePromptInput,
  provider: AIProvider = createAIProvider(),
): Promise<DecisionCaptureExtraction> {
  const prompts = buildDecisionCapturePrompts(input);
  const extraction = await provider.generateStructuredOutput({
    ...prompts,
    schema: decisionCaptureExtractionSchema,
    schemaName: "DecisionCaptureExtraction",
    schemaDescription:
      "Task outcome decision candidates awaiting human verification.",
    temperature: 0,
  });

  assertDecisionExtractionReferencesOutcome(
    extraction,
    input.outcome.id,
    input.outcome.sourceId,
  );

  return extraction;
}

function assertDecisionExtractionReferencesOutcome(
  extraction: DecisionCaptureExtraction,
  outcomeId: string,
  sourceId: string,
) {
  if (extraction.outcomeId !== outcomeId) {
    throw new AIMalformedResponseError(
      "AI decision extraction response referenced a different outcome id.",
    );
  }

  if (extraction.sourceId !== sourceId) {
    throw new AIMalformedResponseError(
      "AI decision extraction response referenced a different source id.",
    );
  }

  for (const candidate of extraction.candidates) {
    const hasOutcomeSource = candidate.sourceEvidence.some(
      (evidence) => evidence.sourceId === sourceId,
    );

    if (!hasOutcomeSource) {
      throw new AIMalformedResponseError(
        "AI decision candidate did not cite the task outcome source.",
      );
    }
  }
}
