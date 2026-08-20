import { AIConfigurationError } from "@/ai/errors";

export type AIProviderName = "openai-compatible";

export type AIConfig = {
  provider: AIProviderName;
  apiKey: string;
  baseUrl: string;
  textModel: string;
  structuredModel: string;
  embeddingModel: string;
  embeddingDimensions: number;
  timeoutMs: number;
  maxRetries: number;
};

export function getAIConfig(
  env: Record<string, string | undefined> = process.env,
): AIConfig {
  const provider = parseProvider(env.AI_PROVIDER ?? "openai-compatible");
  const apiKey = env.AI_API_KEY;

  if (!apiKey) {
    throw new AIConfigurationError("AI_API_KEY is required for AI operations.");
  }

  const textModel = env.AI_TEXT_MODEL ?? "gpt-4.1-mini";
  const structuredModel = env.AI_STRUCTURED_MODEL ?? textModel;
  const embeddingDimensions = Number(env.AI_EMBEDDING_DIMENSIONS ?? "1536");
  const timeoutMs = Number(env.AI_TIMEOUT_MS ?? "30000");
  const maxRetries = Number(env.AI_MAX_RETRIES ?? "1");

  if (!Number.isInteger(embeddingDimensions) || embeddingDimensions <= 0) {
    throw new AIConfigurationError(
      "AI_EMBEDDING_DIMENSIONS must be a positive integer.",
    );
  }

  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new AIConfigurationError("AI_TIMEOUT_MS must be a positive integer.");
  }

  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new AIConfigurationError("AI_MAX_RETRIES must be zero or greater.");
  }

  return {
    provider,
    apiKey,
    baseUrl: env.AI_BASE_URL ?? "https://api.openai.com/v1",
    textModel,
    structuredModel,
    embeddingModel: env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    embeddingDimensions,
    timeoutMs,
    maxRetries,
  };
}

function parseProvider(value: string): AIProviderName {
  if (value === "openai-compatible") {
    return value;
  }

  throw new AIConfigurationError(`Unsupported AI_PROVIDER: ${value}`);
}
