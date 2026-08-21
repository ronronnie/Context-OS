import { describe, expect, it } from "vitest";

import type { AIConfig } from "@/ai/config";
import type { KnowledgeEmbedding, KnowledgeItem } from "@/db/schema";
import {
  getKnowledgeEmbeddingContentHash,
  isKnowledgeEmbeddable,
  shouldRegenerateKnowledgeEmbedding,
} from "@/db/queries/embeddings";

describe("knowledge embedding pipeline", () => {
  it("embeds verified knowledge with meaningful content", () => {
    expect(isKnowledgeEmbeddable(knowledge())).toBe(true);
    expect(
      isKnowledgeEmbeddable(knowledge({ lifecycleStatus: "proposed" })),
    ).toBe(false);
    expect(isKnowledgeEmbeddable(knowledge({ title: "" }))).toBe(false);
  });

  it("allows trusted rejected approach memory but not ordinary rejected items", () => {
    expect(
      isKnowledgeEmbeddable(
        knowledge({
          knowledgeType: "rejected_approach",
          lifecycleStatus: "rejected",
        }),
      ),
    ).toBe(true);
    expect(isKnowledgeEmbeddable(knowledge({ lifecycleStatus: "rejected" }))).toBe(false);
  });

  it("regenerates when meaningful content or model configuration changes", () => {
    const item = knowledge();
    const hash = getKnowledgeEmbeddingContentHash(item);
    const existing = embedding({ contentHash: hash });

    expect(
      shouldRegenerateKnowledgeEmbedding(item, existing, hash, {
        embeddingModel: "text-embedding-3-small",
        embeddingDimensions: 1536,
      } as AIConfig),
    ).toBe(false);
    expect(
      shouldRegenerateKnowledgeEmbedding(
        knowledge({ body: "The permission rule changed." }),
        existing,
        undefined,
        {
          embeddingModel: "text-embedding-3-small",
          embeddingDimensions: 1536,
        } as AIConfig,
      ),
    ).toBe(true);
    expect(
      shouldRegenerateKnowledgeEmbedding(item, existing, hash, {
        embeddingModel: "text-embedding-3-large",
        embeddingDimensions: 3072,
      } as AIConfig),
    ).toBe(true);
  });
});

function knowledge(overrides: Partial<KnowledgeItem> = {}): KnowledgeItem {
  return {
    id: "knowledge",
    productId: "product",
    moduleId: "module",
    featureId: "feature",
    title: "Approval permissions are role-limited",
    body: "Only assigned reviewers can approve reports.",
    knowledgeType: "permission",
    authority: "canonical",
    confidence: 90,
    lifecycleStatus: "verified",
    validFrom: null,
    validUntil: null,
    lastVerifiedAt: new Date("2026-08-01T00:00:00.000Z"),
    createdBy: "user",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  };
}

function embedding(overrides: Partial<KnowledgeEmbedding> = {}): KnowledgeEmbedding {
  return {
    knowledgeItemId: "knowledge",
    productId: "product",
    embedding: [0.1, 0.2],
    embeddingModel: "text-embedding-3-small",
    embeddingDimensions: 1536,
    contentHash: "hash",
    embeddedAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  };
}
