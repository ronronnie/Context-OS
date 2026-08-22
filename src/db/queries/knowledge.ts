import { and, desc, eq, inArray } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import { recordProductAuditEvent } from "@/db/queries/audit";
import {
  isKnowledgeEmbeddable,
  trySyncKnowledgeEmbedding,
} from "@/db/queries/embeddings";
import { assertProductOwnership } from "@/db/queries/products";
import {
  knowledgeEvents,
  knowledgeItems,
  knowledgeRelationships,
  knowledgeSources,
  modules,
  products,
  sources,
  features,
} from "@/db/schema/index";
import {
  getLifecycleEventType,
  validateLifecycleTransition,
  type LifecycleStatus,
} from "@/lib/product-memory/knowledge-model";
import type { KnowledgeLibraryFilters } from "@/lib/workflow/filters";

export async function getKnowledgeLibrary(
  userId: string,
  filters: KnowledgeLibraryFilters = {},
  db: AppDb = defaultDb,
) {
  const conditions = [eq(products.createdBy, userId)];

  if (filters.productId) {
    conditions.push(eq(knowledgeItems.productId, filters.productId));
  }
  if (filters.moduleId) {
    conditions.push(eq(knowledgeItems.moduleId, filters.moduleId));
  }
  if (filters.featureId) {
    conditions.push(eq(knowledgeItems.featureId, filters.featureId));
  }
  if (filters.knowledgeType) {
    conditions.push(eq(knowledgeItems.knowledgeType, filters.knowledgeType));
  }
  if (filters.lifecycleStatus) {
    conditions.push(eq(knowledgeItems.lifecycleStatus, filters.lifecycleStatus));
  }
  if (filters.authority) {
    conditions.push(eq(knowledgeItems.authority, filters.authority));
  }

  const rows = await db
    .select({
      knowledge: knowledgeItems,
      productName: products.name,
      moduleName: modules.name,
      featureName: features.name,
    })
    .from(knowledgeItems)
    .innerJoin(products, eq(knowledgeItems.productId, products.id))
    .leftJoin(modules, eq(knowledgeItems.moduleId, modules.id))
    .leftJoin(features, eq(knowledgeItems.featureId, features.id))
    .where(and(...conditions))
    .orderBy(desc(knowledgeItems.updatedAt))
    .limit(80);
  const sourceCountMap = await getKnowledgeSourceCountMap(
    rows.map((row) => row.knowledge.id),
    db,
  );

  return rows.map((row) => ({
    ...row,
    sourceCount: sourceCountMap.get(row.knowledge.id) ?? 0,
  }));
}

export async function createKnowledgeItem(
  input: typeof knowledgeItems.$inferInsert,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);

  const rows = await db
    .insert(knowledgeItems)
    .values({
      ...input,
      createdBy: userId,
      lifecycleStatus: input.lifecycleStatus ?? "proposed",
    })
    .returning();

  if (rows[0] && isKnowledgeEmbeddable(rows[0])) {
    await trySyncKnowledgeEmbedding(rows[0].id, input.productId, userId, db);
  }

  return rows[0];
}

export async function createFeatureKnowledgeItem(
  input: Omit<typeof knowledgeItems.$inferInsert, "createdBy"> & {
    productId: string;
    moduleId: string;
    featureId: string;
    sourceIds: string[];
  },
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);

  const rows = await db
    .insert(knowledgeItems)
    .values({
      productId: input.productId,
      moduleId: input.moduleId,
      featureId: input.featureId,
      title: input.title,
      body: input.body,
      knowledgeType: input.knowledgeType,
      authority: input.authority,
      confidence: input.confidence,
      lifecycleStatus: input.lifecycleStatus ?? "proposed",
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      lastVerifiedAt: input.lastVerifiedAt,
      createdBy: userId,
    })
    .returning();
  const knowledge = rows[0];

  await replaceKnowledgeSources(
    knowledge.id,
    input.productId,
    input.sourceIds,
    userId,
    db,
  );

  await db.insert(knowledgeEvents).values({
    productId: input.productId,
    featureId: input.featureId,
    knowledgeItemId: knowledge.id,
    eventType: getLifecycleEventType(
      input.knowledgeType,
      input.lifecycleStatus ?? "proposed",
    ),
    toLifecycleStatus: input.lifecycleStatus ?? "proposed",
    title: input.title,
    note: "Knowledge created manually.",
    createdBy: userId,
  });

  if (isKnowledgeEmbeddable(knowledge)) {
    await trySyncKnowledgeEmbedding(knowledge.id, input.productId, userId, db);
  }

  return knowledge;
}

export async function updateKnowledgeItem(
  knowledgeItemId: string,
  productId: string,
  userId: string,
  input: Partial<typeof knowledgeItems.$inferInsert>,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .update(knowledgeItems)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(knowledgeItems.id, knowledgeItemId),
        eq(knowledgeItems.productId, productId),
      ),
    )
    .returning();

  return rows[0] ?? null;
}

export async function updateFeatureKnowledgeItem(
  knowledgeItemId: string,
  productId: string,
  featureId: string,
  userId: string,
  input: Partial<typeof knowledgeItems.$inferInsert> & {
    sourceIds?: string[];
    confirmedRejected?: boolean;
  },
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);
  const existing = await getKnowledgeItem(knowledgeItemId, productId, userId, db);

  if (!existing || existing.featureId !== featureId) {
    throw new Error("Knowledge item not found or not accessible.");
  }

  const nextStatus = input.lifecycleStatus ?? existing.lifecycleStatus;
  validateLifecycleTransition({
    from: existing.lifecycleStatus,
    to: nextStatus,
    confirmed: input.confirmedRejected,
  });

  const rows = await db
    .update(knowledgeItems)
    .set({
      title: input.title,
      body: input.body,
      knowledgeType: input.knowledgeType,
      authority: input.authority,
      confidence: input.confidence,
      lifecycleStatus: nextStatus,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      lastVerifiedAt: input.lastVerifiedAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(knowledgeItems.id, knowledgeItemId),
        eq(knowledgeItems.productId, productId),
      ),
    )
    .returning();
  const updated = rows[0] ?? null;

  if (!updated) {
    return null;
  }

  if (input.sourceIds) {
    await replaceKnowledgeSources(knowledgeItemId, productId, input.sourceIds, userId, db);
  }

  await db.insert(knowledgeEvents).values({
    productId,
    featureId,
    knowledgeItemId,
    eventType: existing.lifecycleStatus === nextStatus
      ? "updated"
      : lifecycleStatusToEventType(nextStatus),
    fromLifecycleStatus: existing.lifecycleStatus,
    toLifecycleStatus: nextStatus,
    title: updated.title,
    note: existing.lifecycleStatus === nextStatus
      ? "Knowledge edited manually."
      : `Lifecycle changed from ${existing.lifecycleStatus} to ${nextStatus}.`,
    createdBy: userId,
  });

  await recordProductAuditEvent(
    {
      productId,
      moduleId: updated.moduleId,
      featureId,
      knowledgeItemId,
      eventType: existing.lifecycleStatus === nextStatus
        ? "knowledge_edited"
        : "lifecycle_changed",
      title: updated.title,
      summary: existing.lifecycleStatus === nextStatus
        ? "Knowledge item edited manually."
        : `Lifecycle changed from ${existing.lifecycleStatus} to ${nextStatus}.`,
      metadata: {
        fromLifecycleStatus: existing.lifecycleStatus,
        toLifecycleStatus: nextStatus,
        sourceIds: input.sourceIds ?? [],
      },
    },
    userId,
    db,
  );

  if (isKnowledgeEmbeddable(updated)) {
    await trySyncKnowledgeEmbedding(updated.id, productId, userId, db);
  }

  return updated;
}

export async function transitionKnowledgeLifecycle(
  knowledgeItemId: string,
  productId: string,
  featureId: string,
  targetStatus: LifecycleStatus,
  userId: string,
  confirmedRejected: boolean,
  db: AppDb = defaultDb,
) {
  const existing = await getKnowledgeItem(knowledgeItemId, productId, userId, db);

  if (!existing || existing.featureId !== featureId) {
    throw new Error("Knowledge item not found or not accessible.");
  }

  validateLifecycleTransition({
    from: existing.lifecycleStatus,
    to: targetStatus,
    confirmed: confirmedRejected,
  });

  const rows = await db
    .update(knowledgeItems)
    .set({
      lifecycleStatus: targetStatus,
      lastVerifiedAt: targetStatus === "verified" ? new Date() : existing.lastVerifiedAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(knowledgeItems.id, knowledgeItemId),
        eq(knowledgeItems.productId, productId),
      ),
    )
    .returning();
  const updated = rows[0];

  await db.insert(knowledgeEvents).values({
    productId,
    featureId,
    knowledgeItemId,
    eventType: lifecycleStatusToEventType(targetStatus),
    fromLifecycleStatus: existing.lifecycleStatus,
    toLifecycleStatus: targetStatus,
    title: existing.title,
    note: `Lifecycle changed from ${existing.lifecycleStatus} to ${targetStatus}.`,
    createdBy: userId,
  });

  await recordProductAuditEvent(
    {
      productId,
      moduleId: updated.moduleId,
      featureId,
      knowledgeItemId,
      eventType: "lifecycle_changed",
      title: existing.title,
      summary: `Lifecycle changed from ${existing.lifecycleStatus} to ${targetStatus}.`,
      metadata: {
        fromLifecycleStatus: existing.lifecycleStatus,
        toLifecycleStatus: targetStatus,
      },
    },
    userId,
    db,
  );

  if (isKnowledgeEmbeddable(updated)) {
    await trySyncKnowledgeEmbedding(updated.id, productId, userId, db);
  }

  return updated;
}

export async function getKnowledgeItem(
  knowledgeItemId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .select()
    .from(knowledgeItems)
    .where(
      and(
        eq(knowledgeItems.id, knowledgeItemId),
        eq(knowledgeItems.productId, productId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getKnowledgeItemDetail(
  knowledgeItemId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const knowledge = await getKnowledgeItem(knowledgeItemId, productId, userId, db);

  if (!knowledge) {
    return null;
  }

  const evidence = await db
    .select({ source: sources })
    .from(knowledgeSources)
    .innerJoin(sources, eq(knowledgeSources.sourceId, sources.id))
    .where(
      and(
        eq(knowledgeSources.knowledgeItemId, knowledgeItemId),
        eq(sources.productId, productId),
      ),
    );
  const outgoingRelationships = await db
    .select()
    .from(knowledgeRelationships)
    .where(
      and(
        eq(knowledgeRelationships.productId, productId),
        eq(knowledgeRelationships.fromKnowledgeId, knowledgeItemId),
      ),
    );
  const incomingRelationships = await db
    .select()
    .from(knowledgeRelationships)
    .where(
      and(
        eq(knowledgeRelationships.productId, productId),
        eq(knowledgeRelationships.toKnowledgeId, knowledgeItemId),
      ),
    );
  const relationshipIds = [
    ...outgoingRelationships.map((item) => item.toKnowledgeId),
    ...incomingRelationships.map((item) => item.fromKnowledgeId),
  ];
  const relatedKnowledge = relationshipIds.length
    ? await db
        .select()
        .from(knowledgeItems)
        .where(
          and(
            eq(knowledgeItems.productId, productId),
            inArray(knowledgeItems.id, relationshipIds),
          ),
        )
    : [];
  const history = await db
    .select()
    .from(knowledgeEvents)
    .where(
      and(
        eq(knowledgeEvents.productId, productId),
        eq(knowledgeEvents.knowledgeItemId, knowledgeItemId),
      ),
    )
    .orderBy(desc(knowledgeEvents.createdAt));
  const productKnowledge = await db
    .select()
    .from(knowledgeItems)
    .where(eq(knowledgeItems.productId, productId))
    .orderBy(desc(knowledgeItems.updatedAt));

  return {
    knowledge,
    sources: evidence.map((row) => row.source),
    relationships: [...outgoingRelationships, ...incomingRelationships],
    relatedKnowledge,
    productKnowledge,
    history,
  };
}

export async function getKnowledgeSourceCountMap(
  knowledgeIds: string[],
  db: AppDb = defaultDb,
) {
  if (!knowledgeIds.length) {
    return new Map<string, number>();
  }

  const rows = await db
    .select()
    .from(knowledgeSources)
    .where(inArray(knowledgeSources.knowledgeItemId, knowledgeIds));

  return rows.reduce((counts, row) => {
    counts.set(row.knowledgeItemId, (counts.get(row.knowledgeItemId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

async function replaceKnowledgeSources(
  knowledgeItemId: string,
  productId: string,
  sourceIds: string[],
  userId: string,
  db: AppDb,
) {
  await assertProductOwnership(productId, userId, db);
  await db
    .delete(knowledgeSources)
    .where(eq(knowledgeSources.knowledgeItemId, knowledgeItemId));

  if (!sourceIds.length) {
    return;
  }

  const accessibleSources = await db
    .select()
    .from(sources)
    .where(and(eq(sources.productId, productId), inArray(sources.id, sourceIds)));

  if (accessibleSources.length !== sourceIds.length) {
    throw new Error("One or more sources are not accessible.");
  }

  await db.insert(knowledgeSources).values(
    sourceIds.map((sourceId) => ({
      knowledgeItemId,
      sourceId,
    })),
  ).onConflictDoNothing();
}

function lifecycleStatusToEventType(status: LifecycleStatus) {
  switch (status) {
    case "verified":
      return "verified" as const;
    case "outdated":
      return "marked_outdated" as const;
    case "rejected":
      return "rejected" as const;
    case "proposed":
      return "updated" as const;
  }
}
