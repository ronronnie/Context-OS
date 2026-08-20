import { z } from "zod";

import { getAIConfig, type AIConfig } from "@/ai/config";
import { AIMalformedResponseError, AIProviderError } from "@/ai/errors";

export type GenerateTextRequest = {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
};

export type GenerateStructuredOutputRequest<T> = GenerateTextRequest & {
  schema: z.ZodType<T>;
  schemaName: string;
  schemaDescription?: string;
};

export type GenerateEmbeddingRequest = {
  input: string;
  model?: string;
  dimensions?: number;
  timeoutMs?: number;
};

export type AIProvider = {
  generateText(request: GenerateTextRequest): Promise<string>;
  generateStructuredOutput<T>(
    request: GenerateStructuredOutputRequest<T>,
  ): Promise<T>;
  generateEmbedding(request: GenerateEmbeddingRequest): Promise<number[]>;
};

type FetchLike = typeof fetch;

export function createAIProvider(
  config: AIConfig = getAIConfig(),
  fetchImpl: FetchLike = fetch,
): AIProvider {
  switch (config.provider) {
    case "openai-compatible":
      return new OpenAICompatibleProvider(config, fetchImpl);
  }
}

class OpenAICompatibleProvider implements AIProvider {
  constructor(
    private readonly config: AIConfig,
    private readonly fetchImpl: FetchLike,
  ) {}

  async generateText(request: GenerateTextRequest) {
    const response = await this.withRetry(() =>
      this.postJson(
        "/chat/completions",
        {
          model: request.model ?? this.config.textModel,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
          temperature: request.temperature ?? 0,
          max_tokens: request.maxOutputTokens,
        },
        request.timeoutMs,
      ),
    );

    const content = chatCompletionContentSchema.parse(response);
    if (!content.trim()) {
      throw new AIMalformedResponseError("AI text response was empty.");
    }

    return content;
  }

  async generateStructuredOutput<T>(
    request: GenerateStructuredOutputRequest<T>,
  ) {
    const jsonText = await this.generateText({
      ...request,
      model: request.model ?? this.config.structuredModel,
      systemPrompt: [
        request.systemPrompt,
        "Return only valid JSON. Do not include markdown fences or commentary.",
        `Schema name: ${request.schemaName}.`,
        request.schemaDescription
          ? `Schema description: ${request.schemaDescription}.`
          : "",
      ].filter(Boolean).join("\n"),
    });
    const parsed = parseJsonResponse(jsonText);

    return request.schema.parse(parsed);
  }

  async generateEmbedding(request: GenerateEmbeddingRequest) {
    const response = await this.withRetry(() =>
      this.postJson(
        "/embeddings",
        {
          model: request.model ?? this.config.embeddingModel,
          input: request.input,
          dimensions: request.dimensions ?? this.config.embeddingDimensions,
        },
        request.timeoutMs,
      ),
    );

    return embeddingResponseSchema.parse(response);
  }

  private async postJson(
    path: string,
    body: Record<string, unknown>,
    timeoutMs = this.config.timeoutMs,
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AIProviderError(
          `AI provider request failed with status ${response.status}.`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      throw new AIProviderError("AI provider request failed.", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < this.config.maxRetries && process.env.NODE_ENV === "development") {
          console.warn(`AI provider retry ${attempt + 1} failed.`, error);
        }
      }
    }

    throw lastError;
  }
}

const chatCompletionContentSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    }),
  ).min(1),
}).transform((response) => response.choices[0].message.content);

const embeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      embedding: z.array(z.number()),
    }),
  ).min(1),
}).transform((response) => response.data[0].embedding);

export function parseJsonResponse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    throw new AIMalformedResponseError("AI response was not valid JSON.");
  }
}
