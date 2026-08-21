import { AIMalformedResponseError } from "@/ai/errors";
import {
  buildProductIntelligencePrompts,
  type ProductIntelligencePromptInput,
} from "@/ai/prompts/product-intelligence";
import type { AIProvider } from "@/ai/provider";
import { createAIProvider } from "@/ai/provider";
import {
  productIntelligenceAnswerSchema,
  type ProductIntelligenceAnswer,
} from "@/ai/schemas/product-intelligence";

export async function generateProductIntelligenceAnswer(
  input: ProductIntelligencePromptInput,
  provider: AIProvider = createAIProvider(),
): Promise<ProductIntelligenceAnswer> {
  const prompts = buildProductIntelligencePrompts(input);
  const answer = await provider.generateStructuredOutput({
    ...prompts,
    schema: productIntelligenceAnswerSchema,
    schemaName: "ProductIntelligenceAnswer",
    schemaDescription:
      "A concise product-aware answer grounded in supplied Product Memory.",
    temperature: 0,
  });

  assertAnswerUsesSuppliedMemory(answer, input.memory.map((item) => item.id));

  return answer;
}

export function assertAnswerUsesSuppliedMemory(
  answer: ProductIntelligenceAnswer,
  suppliedMemoryIds: string[],
) {
  const allowed = new Set(suppliedMemoryIds);
  const invalid = answer.supportingMemory.filter(
    (item) => !allowed.has(item.knowledgeItemId),
  );

  if (invalid.length) {
    throw new AIMalformedResponseError(
      "Product Intelligence answer referenced unsupported Product Memory.",
    );
  }
}
