import { and, asc, desc, eq, or } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import { assertProductOwnership } from "@/db/queries/products";
import { getKnowledgeSourceCountMap } from "@/db/queries/knowledge";
import { getSourcesForProduct } from "@/db/queries/sources";
import {
  contextPacks,
  featureRelationships,
  features,
  knowledgeEvents,
  knowledgeItems,
  knowledgeSources,
  modules,
  productAuditEvents,
  sources,
  tasks,
} from "@/db/schema/index";

export async function getFeature(
  featureId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .select()
    .from(features)
    .where(and(eq(features.id, featureId), eq(features.productId, productId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getFeaturesForModule(
  moduleId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(features)
    .where(and(eq(features.moduleId, moduleId), eq(features.productId, productId)))
    .orderBy(asc(features.position), asc(features.name));
}

export async function createFeature(
  input: typeof features.$inferInsert,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);

  const rows = await db.insert(features).values(input).returning();
  return rows[0];
}

export async function updateFeature(
  featureId: string,
  productId: string,
  input: Partial<
    Pick<
      typeof features.$inferInsert,
      "name" | "description" | "status" | "position"
    >
  >,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .update(features)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(features.id, featureId), eq(features.productId, productId)))
    .returning();

  return rows[0] ?? null;
}

export async function getFeatureKnowledge(
  featureId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.featureId, featureId),
        eq(knowledgeItems.productId, productId),
      ),
    )
    .orderBy(asc(knowledgeItems.createdAt));
}

export async function getFeatureSources(
  featureId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const linkedSources = await db
    .select({ source: sources })
    .from(knowledgeItems)
    .innerJoin(
      knowledgeSources,
      eq(knowledgeItems.id, knowledgeSources.knowledgeItemId),
    )
    .innerJoin(sources, eq(knowledgeSources.sourceId, sources.id))
    .where(
      and(
        eq(knowledgeItems.featureId, featureId),
        eq(knowledgeItems.productId, productId),
      ),
    );
  const attachedSources = await db
    .select({ source: sources })
    .from(sources)
    .where(and(eq(sources.featureId, featureId), eq(sources.productId, productId)));
  const deduped = new Map<string, { source: typeof sources.$inferSelect }>();

  for (const row of [...attachedSources, ...linkedSources]) {
    deduped.set(row.source.id, row);
  }

  return Array.from(deduped.values());
}

export async function getFeatureWorkspace(
  featureId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const product = await assertProductOwnership(productId, userId, db);
  const [feature] = await db
    .select()
    .from(features)
    .where(and(eq(features.id, featureId), eq(features.productId, productId)))
    .limit(1);

  if (!feature) {
    return null;
  }

  const [module] = await db
    .select()
    .from(modules)
    .where(and(eq(modules.id, feature.moduleId), eq(modules.productId, productId)))
    .limit(1);

  if (!module) {
    return null;
  }

  const knowledge = await getFeatureKnowledge(featureId, productId, userId, db);
  const sourceCountMap = await getKnowledgeSourceCountMap(
    knowledge.map((item) => item.id),
    db,
  );
  const featureSources = await getFeatureSources(featureId, productId, userId, db);
  const productSources = await getSourcesForProduct(productId, userId, db);
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
    );
  const relatedFeatureIds = relationships.map((relationship) =>
    relationship.fromFeatureId === featureId
      ? relationship.toFeatureId
      : relationship.fromFeatureId,
  );
  const productFeatures = await db
    .select()
    .from(features)
    .where(eq(features.productId, productId));
  const relatedFeatures = productFeatures.filter((candidate) =>
    relatedFeatureIds.includes(candidate.id),
  );
  const featureTasks = await db
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.productId, productId), eq(tasks.primaryFeatureId, featureId)),
    )
    .orderBy(desc(tasks.updatedAt));
  const taskIds = new Set(featureTasks.map((task) => task.id));
  const packs = await db
    .select()
    .from(contextPacks)
    .where(eq(contextPacks.productId, productId))
    .orderBy(desc(contextPacks.createdAt));
  const events = await db
    .select()
    .from(knowledgeEvents)
    .where(eq(knowledgeEvents.featureId, featureId))
    .orderBy(desc(knowledgeEvents.createdAt));
  const auditEvents = await db
    .select()
    .from(productAuditEvents)
    .where(
      and(
        eq(productAuditEvents.productId, productId),
        eq(productAuditEvents.featureId, featureId),
      ),
    )
    .orderBy(desc(productAuditEvents.createdAt));

  return {
    product,
    module,
    feature,
    knowledge: knowledge.map((item) => ({
      ...item,
      sourceCount: sourceCountMap.get(item.id) ?? 0,
    })),
    sources: featureSources.map((row) => row.source),
    productSources,
    productFeatures,
    relatedFeatures,
    relationships,
    tasks: featureTasks,
    contextPacks: packs.filter((pack) => taskIds.has(pack.taskId)),
    timeline: [
      ...events.map((event) => ({
        id: event.id,
        productId: event.productId,
        featureId: event.featureId,
        knowledgeItemId: event.knowledgeItemId,
        eventType: event.eventType,
        fromLifecycleStatus: event.fromLifecycleStatus,
        toLifecycleStatus: event.toLifecycleStatus,
        title: event.title,
        note: event.note,
        createdBy: event.createdBy,
        createdAt: event.createdAt,
      })),
      ...auditEvents.map((event) => ({
        id: event.id,
        productId: event.productId,
        featureId: event.featureId,
        knowledgeItemId: event.knowledgeItemId,
        eventType: event.eventType,
        fromLifecycleStatus: null,
        toLifecycleStatus: null,
        title: event.title,
        note: event.summary,
        createdBy: event.createdBy,
        createdAt: event.createdAt,
      })),
      ...knowledge
        .filter((item) => events.every((event) => event.knowledgeItemId !== item.id))
        .map((item) => ({
          id: `derived-${item.id}`,
          productId,
          featureId,
          knowledgeItemId: item.id,
          eventType: item.knowledgeType === "decision"
            ? "decision_added"
            : item.knowledgeType === "rejected_approach"
              ? "rejected_approach_added"
              : item.lifecycleStatus === "verified"
                ? "verified"
                : "created",
          fromLifecycleStatus: null,
          toLifecycleStatus: item.lifecycleStatus,
          title: item.title,
          note: item.body,
          createdBy: item.createdBy,
          createdAt: item.lastVerifiedAt ?? item.createdAt,
        })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  };
}

export async function getFeatureHistory(
  featureId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.featureId, featureId),
        eq(knowledgeItems.productId, productId),
      ),
    )
    .orderBy(asc(knowledgeItems.validFrom), asc(knowledgeItems.createdAt));
}
