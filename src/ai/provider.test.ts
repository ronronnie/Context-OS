import { describe, expect, it } from "vitest";
import { z } from "zod";

import { getAIConfig } from "@/ai/config";
import { AIConfigurationError, AIProviderError } from "@/ai/errors";
import { createAIProvider } from "@/ai/provider";

const baseEnv = {
  AI_PROVIDER: "openai-compatible",
  AI_API_KEY: "test-key",
  AI_TEXT_MODEL: "text-model",
  AI_STRUCTURED_MODEL: "structured-model",
  AI_EMBEDDING_MODEL: "embedding-model",
  AI_EMBEDDING_DIMENSIONS: "1536",
};

describe("AI provider abstraction", () => {
  it("selects the configured provider and models", () => {
    const config = getAIConfig(baseEnv);

    expect(config.provider).toBe("openai-compatible");
    expect(config.textModel).toBe("text-model");
    expect(config.structuredModel).toBe("structured-model");
    expect(config.embeddingModel).toBe("embedding-model");
  });

  it("fails clearly for missing or unsupported provider configuration", () => {
    expect(() => getAIConfig({ AI_PROVIDER: "unknown", AI_API_KEY: "key" }))
      .toThrow(AIConfigurationError);
    expect(() => getAIConfig({ AI_PROVIDER: "openai-compatible" }))
      .toThrow("AI_API_KEY is required");
  });

  it("validates structured responses against the requested schema", async () => {
    const provider = createAIProvider(getAIConfig(baseEnv), async () =>
      jsonResponse({
        choices: [{ message: { content: '{"status":"ok"}' } }],
      }),
    );

    await expect(provider.generateStructuredOutput({
      systemPrompt: "Return JSON.",
      userPrompt: "test",
      schemaName: "TestSchema",
      schema: z.object({ status: z.literal("ok") }),
    })).resolves.toEqual({ status: "ok" });
  });

  it("rejects malformed structured responses", async () => {
    const provider = createAIProvider(getAIConfig(baseEnv), async () =>
      jsonResponse({
        choices: [{ message: { content: "not-json" } }],
      }),
    );

    await expect(provider.generateStructuredOutput({
      systemPrompt: "Return JSON.",
      userPrompt: "test",
      schemaName: "TestSchema",
      schema: z.object({ status: z.literal("ok") }),
    })).rejects.toThrow("AI response was not valid JSON");
  });

  it("rejects provider failures after retry attempts", async () => {
    const provider = createAIProvider(
      getAIConfig({ ...baseEnv, AI_MAX_RETRIES: "1" }),
      async () => jsonResponse({ error: "failed" }, 500),
    );

    await expect(provider.generateText({
      systemPrompt: "test",
      userPrompt: "test",
    })).rejects.toThrow(AIProviderError);
  });

  it("retries transient provider failures", async () => {
    let attempts = 0;
    const provider = createAIProvider(
      getAIConfig({ ...baseEnv, AI_MAX_RETRIES: "1" }),
      async () => {
        attempts += 1;
        if (attempts === 1) {
          return jsonResponse({ error: "temporary" }, 500);
        }
        return jsonResponse({
          choices: [{ message: { content: "recovered" } }],
        });
      },
    );

    await expect(provider.generateText({
      systemPrompt: "test",
      userPrompt: "test",
    })).resolves.toBe("recovered");
    expect(attempts).toBe(2);
  });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
