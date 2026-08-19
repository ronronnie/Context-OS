import { z } from "zod";

const providerEnvSchema = z.object({
  AI_PROVIDER: z.enum(["openai-compatible"]).default("openai-compatible"),
  AI_API_KEY: z.string().min(1).optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_MODEL: z.string().min(1).optional(),
});

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextInput = {
  messages: LlmMessage[];
  temperature?: number;
};

export type GenerateTextOutput = {
  text: string;
  model: string;
  provider: string;
};

export interface AiProvider {
  generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
}

export function createAiProvider(env = process.env): AiProvider {
  const parsed = providerEnvSchema.parse(env);

  if (!parsed.AI_API_KEY) {
    return new DisabledAiProvider();
  }

  return new OpenAiCompatibleProvider({
    apiKey: parsed.AI_API_KEY,
    baseUrl: parsed.AI_BASE_URL ?? "https://api.openai.com/v1",
    model: parsed.AI_MODEL ?? "gpt-4.1-mini",
    provider: parsed.AI_PROVIDER,
  });
}

class DisabledAiProvider implements AiProvider {
  async generateText(): Promise<GenerateTextOutput> {
    return {
      text:
        "AI provider is not configured. Set AI_PROVIDER, AI_API_KEY, AI_BASE_URL, and AI_MODEL to enable extraction.",
      model: "disabled",
      provider: "disabled",
    };
  }
}

class OpenAiCompatibleProvider implements AiProvider {
  constructor(
    private readonly config: {
      apiKey: string;
      baseUrl: string;
      model: string;
      provider: string;
    },
  ) {}

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: input.messages,
        temperature: input.temperature ?? 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI provider request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      text: payload.choices?.[0]?.message?.content ?? "",
      model: this.config.model,
      provider: this.config.provider,
    };
  }
}
