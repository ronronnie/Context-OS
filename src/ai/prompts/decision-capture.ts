export type DecisionCapturePromptInput = {
  product: {
    id: string;
    name: string;
    description: string;
  };
  task: {
    id: string;
    title: string;
    description: string;
  };
  contextPack: {
    id: string;
    version: number;
    generatedContent: string;
  };
  outcome: {
    id: string;
    sourceId: string;
    summary: string;
    finalDecisionNotes: string;
    references: string;
    pastedOutcome: string;
    moduleId: string | null;
    featureId: string | null;
  };
  existingKnowledge: Array<{
    id: string;
    title: string;
    body: string;
    knowledgeType: string;
    authority: string;
    lifecycleStatus: string;
  }>;
};

export function buildDecisionCapturePrompts(input: DecisionCapturePromptInput) {
  return {
    systemPrompt: [
      "You extract decision candidates for Context OS Product Memory.",
      "You are not a chatbot and you do not provide implementation advice.",
      "Treat the pasted task outcome as a source that still needs human review.",
      "Do not mark anything as trusted or verified.",
      "Extract only source-backed changes to product memory.",
      "Preserve rejected approaches, known issues, and open questions.",
      "Preserve contradictions instead of resolving them silently.",
      "Prefer several atomic candidates over one broad summary.",
      "Every candidate must cite the outcome sourceId.",
      "Use existingKnowledge ids when a candidate relates to, supersedes, or contradicts prior memory.",
    ].join("\n"),
    userPrompt: JSON.stringify({
      operation: "extractDecisionCandidates",
      instructions: {
        output: "Return JSON matching the requested schema.",
        candidateStatus: "awaiting human review",
        allowedKnowledgeTypes: [
          "decision",
          "product_rule",
          "ux_pattern",
          "technical_constraint",
          "rejected_approach",
          "open_question",
          "known_issue",
          "terminology",
        ],
        extract: [
          "decisions",
          "product rules",
          "UX patterns",
          "technical constraints",
          "rejected approaches",
          "open questions",
          "known issues",
          "terminology changes",
        ],
        sourceEvidence:
          "Every candidate must cite outcome.sourceId and include a short supporting excerpt from pastedOutcome, finalDecisionNotes, summary, or references.",
      },
      input,
    }, null, 2),
  };
}
