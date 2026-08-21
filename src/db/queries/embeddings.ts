import { createHash } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { getAIConfig } from "@/ai/config";
import { AIConfigurationError, AIProviderError } from "@/ai/errors";
import type { AIProvider } from "@/ai/provider";
import { createAIProvider } from "@/ai/provider";
import { db as defaultDb, type AppDb } from "@/db";
import { assertProductOwnership } from "@/db/queries/products";
import { knowledgeEmbeddings, knowledgeItems } from "@/db/schema/index";

type KnowledgeForEmbedding = typeof knowledgeItems.$inferSelect;
type ExistingEmbedding = typeof knowledgeEmbeddings.$inferSelect;

export type KnowledgeEmbeddingSyncResult =
  | { status: "embedded"; knowledgeItemId: string; contentHash: string }
  | { status: "unchanged"; knowledgeItemId: string; contentHash: string }
  | { status: "skipped"; knowledgeItemId: string; reason: string };

export async function syncKnowledgeEmbedding(
  knowledgeItemId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
  provider?: AIProvider,
): Promise<KnowledgeEmbeddingSyncResult> {
  await assertProductOwnership(productId, userId, db);

  const [knowledge] = await db
    .select()
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.id, knowledgeItemId),
        eq(knowledgeItems.productId, productId),
      ),
    )
    .limit(1);

  if (!knowledge) {
    throw new Error("Knowledge item not found or not accessible.");
  }

  if (!isKnowledgeEmbeddable(knowledge)) {
    return {
      status: "skipped",
      knowledgeItemId,
      reason:
        "Only verified Product Memory and trusted rejected-approach memory are embedded automatically.",
    };
  }

  const contentHash = getKnowledgeEmbeddingContentHash(knowledge);
  const [existing] = await db
    .select()
    .from(knowledgeEmbeddings)
    .where(eq(knowledgeEmbeddings.knowledgeItemId, knowledgeItemId))
    .limit(1);

  const config = getAIConfig();
  if (!shouldRegenerateKnowledgeEmbedding(knowledge, existing, contentHash, config)) {
    return { status: "unchanged", knowledgeItemId, contentHash };
  }

  const embeddingProvider = provider ?? createAIProvider(config);
  const embedding = await embeddingProvider.generateEmbedding({
    input: buildKnowledgeEmbeddingInput(knowledge),
    model: config.embeddingModel,
    dimensions: config.embeddingDimensions,
  });

  if (embedding.length !== config.embeddingDimensions) {
    throw new AIProviderError(
      `Embedding dimension mismatch: expected ${config.embeddingDimensions}, received ${embedding.length}.`,
    );
  }

  await db
    .insert(knowledgeEmbeddings)
    .values({
      knowledgeItemId,
      productId,
      embedding,
      embeddingModel: config.embeddingModel,
      embeddingDimensions: config.embeddingDimensions,
      contentHash,
    })
    .onConflictDoUpdate({
      target: knowledgeEmbeddings.knowledgeItemId,
      set: {
        productId,
        embedding,
        embeddingModel: config.embeddingModel,
        embeddingDimensions: config.embeddingDimensions,
        contentHash,
        embeddedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return { status: "embedded", knowledgeItemId, contentHash };
}

export async function trySyncKnowledgeEmbedding(
  knowledgeItemId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
  provider?: AIProvider,
) {
  try {
    return await syncKnowledgeEmbedding(knowledgeItemId, productId, userId, db, provider);
  } catch (error) {
    if (error instanceof AIConfigurationError || error instanceof AIProviderError) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Knowledge embedding sync skipped.", error.message);
      }

      return {
        status: "skipped",
        knowledgeItemId,
        reason: error.message,
      } satisfies KnowledgeEmbeddingSyncResult;
    }

    throw error;
  }
}

export function isKnowledgeEmbeddable(
  knowledge: Pick<
    KnowledgeForEmbedding,
    "knowledgeType" | "lifecycleStatus" | "title" | "body"
  >,
) {
  return (
    (knowledge.lifecycleStatus === "verified" ||
      (knowledge.lifecycleStatus === "rejected" &&
        knowledge.knowledgeType === "rejected_approach")) &&
    knowledge.title.trim().length > 0 &&
    knowledge.body.trim().length > 0
  );
}

export function shouldRegenerateKnowledgeEmbedding(
  knowledge: KnowledgeForEmbedding,
  existing: ExistingEmbedding | undefined,
  contentHash = getKnowledgeEmbeddingContentHash(knowledge),
  config = getAIConfig(),
) {
  if (!isKnowledgeEmbeddable(knowledge)) {
    return false;
  }
  if (!existing) {
    return true;
  }

  return (
    existing.contentHash !== contentHash ||
    existing.embeddingModel !== config.embeddingModel ||
    existing.embeddingDimensions !== config.embeddingDimensions
  );
}

export function buildKnowledgeEmbeddingInput(
  knowledge: Pick<
    KnowledgeForEmbedding,
    "title" | "body" | "knowledgeType" | "authority" | "lifecycleStatus"
  >,
) {
  return [
    `Title: ${knowledge.title}`,
    `Type: ${knowledge.knowledgeType}`,
    `Authority: ${knowledge.authority}`,
    `Lifecycle: ${knowledge.lifecycleStatus}`,
    `Body: ${knowledge.body}`,
  ].join("\n");
}

export function getKnowledgeEmbeddingContentHash(
  knowledge: Pick<
    KnowledgeForEmbedding,
    "title" | "body" | "knowledgeType" | "authority" | "lifecycleStatus"
  >,
) {
  return createHash("sha256")
    .update(buildKnowledgeEmbeddingInput(knowledge))
    .digest("hex");
}
