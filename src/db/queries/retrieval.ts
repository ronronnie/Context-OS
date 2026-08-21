import { and, eq, inArray, or } from "drizzle-orm";
import { cosineDistance } from "drizzle-orm/sql/functions";

import { getAIConfig } from "@/ai/config";
import { AIProviderError } from "@/ai/errors";
import type { AIProvider } from "@/ai/provider";
import { createAIProvider } from "@/ai/provider";
import { db as defaultDb, type AppDb } from "@/db";
import { assertProductOwnership } from "@/db/queries/products";
import {
  featureRelationships,
  features,
  knowledgeEmbeddings,
  knowledgeItems,
  knowledgeRelationships,
} from "@/db/schema/index";
import {
  rankRetrievedKnowledgeCandidates,
  type RankedRetrievalResult,
} from "@/lib/retrieval/hybrid-ranking";

export type RetrieveProductContextInput = {
  productId: string;
  userId: string;
  taskDescription: string;
  primaryFeatureId?: string;
  limit?: number;
  includeDiagnostics?: boolean;
};

export type RetrieveProductContextResult = {
  results: RankedRetrievalResult[];
};

export async function retrieveProductContext(
  input: RetrieveProductContextInput,
  db: AppDb = defaultDb,
  provider?: AIProvider,
): Promise<RetrieveProductContextResult> {
  await assertProductOwnership(input.productId, input.userId, db);

  const trimmedTask = input.taskDescription.trim();
  if (!trimmedTask) {
    throw new Error("Task description is required for context retrieval.");
  }

  const config = getAIConfig();
  const activeProvider = provider ?? createAIProvider(config);
  const queryEmbedding = await activeProvider.generateEmbedding({
    input: trimmedTask,
    model: config.embeddingModel,
    dimensions: config.embeddingDimensions,
  });

  if (queryEmbedding.length !== config.embeddingDimensions) {
    throw new AIProviderError(
      `Query embedding dimension mismatch: expected ${config.embeddingDimensions}, received ${queryEmbedding.length}.`,
    );
  }

  const graphScope = await getRetrievalGraphScope(
    input.productId,
    input.primaryFeatureId,
    db,
  );
  const semanticDistance = cosineDistance(
    knowledgeEmbeddings.embedding,
    queryEmbedding,
  );
  const rows = await db
    .select({
      knowledgeItem: knowledgeItems,
      semanticDistance,
    })
    .from(knowledgeEmbeddings)
    .innerJoin(
      knowledgeItems,
      eq(knowledgeEmbeddings.knowledgeItemId, knowledgeItems.id),
    )
    .where(
      and(
        eq(knowledgeEmbeddings.productId, input.productId),
        eq(knowledgeItems.productId, input.productId),
      ),
    )
    .orderBy(semanticDistance)
    .limit(Math.max(input.limit ?? 12, 24));

  const relationshipPaths = await getKnowledgeRelationshipPaths(
    input.productId,
    rows.map((row) => row.knowledgeItem.id),
    db,
  );
  const ranked = rankRetrievedKnowledgeCandidates(
    trimmedTask,
    rows.map((row) => ({
      knowledgeItem: row.knowledgeItem,
      semanticScore: distanceToScore(Number(row.semanticDistance)),
      primaryFeatureId: input.primaryFeatureId,
      primaryModuleId: graphScope.primaryModuleId,
      relatedFeatureIds: graphScope.relatedFeatureIds,
      relationshipPath: relationshipPaths.get(row.knowledgeItem.id),
    })),
    input.includeDiagnostics ?? process.env.NODE_ENV === "development",
  );

  return {
    results: ranked.slice(0, input.limit ?? 12),
  };
}

async function getRetrievalGraphScope(
  productId: string,
  primaryFeatureId: string | undefined,
  db: AppDb,
) {
  if (!primaryFeatureId) {
    return {
      primaryModuleId: undefined,
      relatedFeatureIds: [],
    };
  }

  const [primaryFeature] = await db
    .select()
    .from(features)
    .where(and(eq(features.id, primaryFeatureId), eq(features.productId, productId)))
    .limit(1);

  if (!primaryFeature) {
    throw new Error("Primary feature is not accessible for this product.");
  }

  const relationships = await db
    .select()
    .from(featureRelationships)
    .where(
      and(
        eq(featureRelationships.productId, productId),
        or(
          eq(featureRelationships.fromFeatureId, primaryFeatureId),
          eq(featureRelationships.toFeatureId, primaryFeatureId),
        ),
      ),
    );

  return {
    primaryModuleId: primaryFeature.moduleId,
    relatedFeatureIds: Array.from(new Set(
      relationships.map((relationship) =>
        relationship.fromFeatureId === primaryFeatureId
          ? relationship.toFeatureId
          : relationship.fromFeatureId,
      ),
    )),
  };
}

async function getKnowledgeRelationshipPaths(
  productId: string,
  knowledgeIds: string[],
  db: AppDb,
) {
  if (!knowledgeIds.length) {
    return new Map<string, string>();
  }

  const relationships = await db
    .select()
    .from(knowledgeRelationships)
    .where(
      and(
        eq(knowledgeRelationships.productId, productId),
        or(
          inArray(knowledgeRelationships.fromKnowledgeId, knowledgeIds),
          inArray(knowledgeRelationships.toKnowledgeId, knowledgeIds),
        ),
      ),
    );

  return relationships.reduce((paths, relationship) => {
    const label = relationship.reason
      ? `${relationship.relationshipType}: ${relationship.reason}`
      : relationship.relationshipType;

    paths.set(relationship.fromKnowledgeId, label);
    paths.set(relationship.toKnowledgeId, label);
    return paths;
  }, new Map<string, string>());
}

function distanceToScore(distance: number) {
  if (!Number.isFinite(distance)) {
    return 0;
  }

  return Math.max(0, Math.min(1, 1 - distance));
}
