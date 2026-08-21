import { and, asc, eq, inArray, or } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import { assertProductOwnership } from "@/db/queries/products";
import {
  featureRelationships,
  features,
  knowledgeItems,
  knowledgeRelationships,
  modules,
  sources,
} from "@/db/schema/index";
import {
  featureRelationshipTypes,
  getGraphBucketForKnowledgeType,
  knowledgeRelationshipTypes,
  type FeatureRelationshipType,
  type KnowledgeRelationshipType,
} from "@/lib/product-graph/relationships";

export async function getFeatureNeighborhood(
  featureId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const [feature] = await db
    .select()
    .from(features)
    .where(and(eq(features.id, featureId), eq(features.productId, productId)))
    .limit(1);

  if (!feature) {
    return null;
  }

  const relationships = await db
    .select()
    .from(featureRelationships)
    .where(
      and(
        eq(featureRelationships.productId, productId),
        or(
          eq(featureRelationships.fromFeatureId, featureId),
          eq(featureRelationships.toFeatureId, featureId),
        ),
      ),
    )
    .orderBy(asc(featureRelationships.relationshipType), asc(featureRelationships.createdAt));

  const relatedFeatureIds = Array.from(new Set(
    relationships.map((relationship) =>
      relationship.fromFeatureId === featureId
        ? relationship.toFeatureId
        : relationship.fromFeatureId,
    ),
  ));
  const relatedFeatures = relatedFeatureIds.length
    ? await db
        .select()
        .from(features)
        .where(
          and(
            eq(features.productId, productId),
            inArray(features.id, relatedFeatureIds),
          ),
        )
    : [];
  const knowledge = await db
    .select()
    .from(knowledgeItems)
    .where(and(eq(knowledgeItems.productId, productId), eq(knowledgeItems.featureId, featureId)))
    .orderBy(asc(knowledgeItems.knowledgeType), asc(knowledgeItems.title));

  return {
    feature,
    relationships,
    relatedFeatures,
    knowledge,
    graphBuckets: summarizeKnowledgeBuckets(knowledge),
  };
}

export async function getKnowledgeNeighborhood(
  knowledgeItemId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
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
    return null;
  }

  const relationships = await db
    .select()
    .from(knowledgeRelationships)
    .where(
      and(
        eq(knowledgeRelationships.productId, productId),
        or(
          eq(knowledgeRelationships.fromKnowledgeId, knowledgeItemId),
          eq(knowledgeRelationships.toKnowledgeId, knowledgeItemId),
        ),
      ),
    )
    .orderBy(
      asc(knowledgeRelationships.relationshipType),
      asc(knowledgeRelationships.createdAt),
    );
  const relatedKnowledgeIds = Array.from(new Set(
    relationships.map((relationship) =>
      relationship.fromKnowledgeId === knowledgeItemId
        ? relationship.toKnowledgeId
        : relationship.fromKnowledgeId,
    ),
  ));
  const relatedKnowledge = relatedKnowledgeIds.length
    ? await db
        .select()
        .from(knowledgeItems)
        .where(
          and(
            eq(knowledgeItems.productId, productId),
            inArray(knowledgeItems.id, relatedKnowledgeIds),
          ),
        )
    : [];

  return {
    knowledge,
    relationships,
    relatedKnowledge,
  };
}

export async function getProductGraphSummary(
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const product = await assertProductOwnership(productId, userId, db);
  const [productModules, productFeatures, productKnowledge, featureEdges, knowledgeEdges, productSources] =
    await Promise.all([
      db
        .select()
        .from(modules)
        .where(eq(modules.productId, productId))
        .orderBy(asc(modules.position), asc(modules.name)),
      db
        .select()
        .from(features)
        .where(eq(features.productId, productId))
        .orderBy(asc(features.position), asc(features.name)),
      db
        .select()
        .from(knowledgeItems)
        .where(eq(knowledgeItems.productId, productId))
        .orderBy(asc(knowledgeItems.knowledgeType), asc(knowledgeItems.title)),
      db
        .select()
        .from(featureRelationships)
        .where(eq(featureRelationships.productId, productId))
        .orderBy(asc(featureRelationships.relationshipType), asc(featureRelationships.createdAt)),
      db
        .select()
        .from(knowledgeRelationships)
        .where(eq(knowledgeRelationships.productId, productId))
        .orderBy(asc(knowledgeRelationships.relationshipType), asc(knowledgeRelationships.createdAt)),
      db
        .select()
        .from(sources)
        .where(eq(sources.productId, productId))
        .orderBy(asc(sources.name)),
    ]);

  return {
    product,
    modules: productModules,
    features: productFeatures,
    knowledge: productKnowledge,
    featureRelationships: featureEdges,
    knowledgeRelationships: knowledgeEdges,
    sources: productSources,
    buckets: summarizeKnowledgeBuckets(productKnowledge),
  };
}

export async function createFeatureRelationship(
  input: {
    productId: string;
    fromFeatureId: string;
    toFeatureId: string;
    relationshipType: FeatureRelationshipType;
    reason?: string;
  },
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);
  assertSupportedFeatureRelationship(input.relationshipType);
  assertNotSelfRelationship(input.fromFeatureId, input.toFeatureId);

  await assertFeaturesBelongToProduct(
    input.productId,
    [input.fromFeatureId, input.toFeatureId],
    db,
  );

  const rows = await db
    .insert(featureRelationships)
    .values({
      productId: input.productId,
      fromFeatureId: input.fromFeatureId,
      toFeatureId: input.toFeatureId,
      relationshipType: input.relationshipType,
      reason: input.reason?.trim() ?? "",
      createdBy: userId,
    })
    .onConflictDoUpdate({
      target: [
        featureRelationships.fromFeatureId,
        featureRelationships.toFeatureId,
        featureRelationships.relationshipType,
      ],
      set: {
        reason: input.reason?.trim() ?? "",
        createdBy: userId,
        updatedAt: new Date(),
      },
    })
    .returning();

  return rows[0];
}

export async function createKnowledgeRelationship(
  input: {
    productId: string;
    fromKnowledgeId: string;
    toKnowledgeId: string;
    relationshipType: KnowledgeRelationshipType;
    reason?: string;
  },
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);
  assertSupportedKnowledgeRelationship(input.relationshipType);
  assertNotSelfRelationship(input.fromKnowledgeId, input.toKnowledgeId);

  await assertKnowledgeBelongsToProduct(
    input.productId,
    [input.fromKnowledgeId, input.toKnowledgeId],
    db,
  );

  const rows = await db
    .insert(knowledgeRelationships)
    .values({
      productId: input.productId,
      fromKnowledgeId: input.fromKnowledgeId,
      toKnowledgeId: input.toKnowledgeId,
      relationshipType: input.relationshipType,
      reason: input.reason?.trim() ?? "",
      createdBy: userId,
    })
    .onConflictDoUpdate({
      target: [
        knowledgeRelationships.fromKnowledgeId,
        knowledgeRelationships.toKnowledgeId,
        knowledgeRelationships.relationshipType,
      ],
      set: {
        reason: input.reason?.trim() ?? "",
        createdBy: userId,
        updatedAt: new Date(),
      },
    })
    .returning();

  return rows[0];
}

export async function removeRelationship(
  input: {
    productId: string;
    relationshipId: string;
    relationshipKind: "feature" | "knowledge";
  },
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);

  if (input.relationshipKind === "feature") {
    const rows = await db
      .delete(featureRelationships)
      .where(
        and(
          eq(featureRelationships.id, input.relationshipId),
          eq(featureRelationships.productId, input.productId),
        ),
      )
      .returning();
    return rows[0] ?? null;
  }

  const rows = await db
    .delete(knowledgeRelationships)
    .where(
      and(
        eq(knowledgeRelationships.id, input.relationshipId),
        eq(knowledgeRelationships.productId, input.productId),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

function summarizeKnowledgeBuckets(items: Array<typeof knowledgeItems.$inferSelect>) {
  return items.reduce(
    (buckets, item) => {
      const bucket = getGraphBucketForKnowledgeType(item.knowledgeType);
      buckets[bucket] += 1;
      return buckets;
    },
    {
      components: 0,
      constraints: 0,
      decisions: 0,
      memory: 0,
    },
  );
}

async function assertFeaturesBelongToProduct(
  productId: string,
  featureIds: string[],
  db: AppDb,
) {
  const rows = await db
    .select({ id: features.id })
    .from(features)
    .where(and(eq(features.productId, productId), inArray(features.id, featureIds)));

  if (rows.length !== new Set(featureIds).size) {
    throw new Error("One or more features are not accessible for this product.");
  }
}

async function assertKnowledgeBelongsToProduct(
  productId: string,
  knowledgeIds: string[],
  db: AppDb,
) {
  const rows = await db
    .select({ id: knowledgeItems.id })
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.productId, productId),
        inArray(knowledgeItems.id, knowledgeIds),
      ),
    );

  if (rows.length !== new Set(knowledgeIds).size) {
    throw new Error("One or more knowledge items are not accessible for this product.");
  }
}

function assertSupportedFeatureRelationship(type: string) {
  if (!featureRelationshipTypes.includes(type as FeatureRelationshipType)) {
    throw new Error(`Unsupported feature relationship type: ${type}`);
  }
}

function assertSupportedKnowledgeRelationship(type: string) {
  if (!knowledgeRelationshipTypes.includes(type as KnowledgeRelationshipType)) {
    throw new Error(`Unsupported knowledge relationship type: ${type}`);
  }
}

function assertNotSelfRelationship(fromId: string, toId: string) {
  if (fromId === toId) {
    throw new Error("A relationship must connect two different graph nodes.");
  }
}
