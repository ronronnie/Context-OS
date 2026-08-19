import { createAiProvider } from "@/ai/provider";

export type ExtractedMemoryDraft = {
  claim: string;
  type:
    | "current_state"
    | "decision"
    | "history"
    | "constraint"
    | "relationship"
    | "pattern";
  evidenceQuote?: string;
  confidence: number;
  requiresReview: boolean;
};

export async function extractMemoryDraftsFromSource(sourceText: string) {
  const provider = createAiProvider();
  const response = await provider.generateText({
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Extract structured product memory from source material. Preserve contradictions. Mark every claim as requiring human review.",
      },
      {
        role: "user",
        content: `Return JSON array of memory drafts with claim, type, evidenceQuote, confidence, and requiresReview.\n\nSource:\n${sourceText}`,
      },
    ],
  });

  return response.text;
}
