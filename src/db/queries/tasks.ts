import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import { assertProductOwnership } from "@/db/queries/products";
import {
  contextPackItems,
  contextPacks,
  features,
  knowledgeItems,
  knowledgeSources,
  modules,
  products,
  sources,
  tasks,
} from "@/db/schema/index";
import {
  compileContextPack,
  getContextPackMetadata,
  type ContextPackMemoryResult,
} from "@/lib/context-packs/compiler";
import type { TaskIntent } from "@/lib/context-packs/forms";
import type {
  RetrieveProductContextInput,
  RetrieveProductContextResult,
} from "@/db/queries/retrieval";
import { retrieveProductContext } from "@/db/queries/retrieval";

type TaskCreationInput = {
  productId: string;
  primaryFeatureId?: string;
  title: string;
  description: string;
  taskIntent: TaskIntent;
};

type RetrievalFn = (
  input: RetrieveProductContextInput,
  db?: AppDb,
) => Promise<RetrieveProductContextResult>;

export async function createTask(
  input: Omit<typeof tasks.$inferInsert, "createdBy">,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);

  const rows = await db
    .insert(tasks)
    .values({
      ...input,
      createdBy: userId,
    })
    .returning();

  return rows[0];
}

export async function createTaskAndGenerateContextPack(
  input: TaskCreationInput,
  userId: string,
  db: AppDb = defaultDb,
  retrieval: RetrievalFn = retrieveProductContext,
) {
  await assertProductOwnership(input.productId, userId, db);

  if (input.primaryFeatureId) {
    await assertFeatureBelongsToProduct(input.productId, input.primaryFeatureId, db);
  }

  const [task] = await db
    .insert(tasks)
    .values({
      productId: input.productId,
      primaryFeatureId: input.primaryFeatureId,
      title: input.title,
      description: input.description,
      status: "ready",
      createdBy: userId,
    })
    .returning();

  const pack = await generateContextPackForTask(
    task.id,
    input.productId,
    userId,
    input.taskIntent,
    db,
    retrieval,
  );

  return { task, contextPack: pack };
}

export async function regenerateContextPackForTask(
  productId: string,
  taskId: string,
  userId: string,
  taskIntent: TaskIntent = "design",
  db: AppDb = defaultDb,
  retrieval: RetrievalFn = retrieveProductContext,
) {
  return generateContextPackForTask(
    taskId,
    productId,
    userId,
    taskIntent,
    db,
    retrieval,
  );
}

export async function getTaskCreationOptions(userId: string, db: AppDb = defaultDb) {
  const userProducts = await db
    .select()
    .from(products)
    .where(eq(products.createdBy, userId))
    .orderBy(asc(products.name));
  const productIds = userProducts.map((product) => product.id);
  const productFeatures = productIds.length
    ? await db
        .select()
        .from(features)
        .where(inArray(features.productId, productIds))
        .orderBy(asc(features.name))
    : [];

  return {
    products: userProducts,
    features: productFeatures,
  };
}

export async function getTasksForUser(userId: string, db: AppDb = defaultDb) {
  return db
    .select({
      task: tasks,
      product: products,
      feature: features,
      latestPack: contextPacks,
    })
    .from(tasks)
    .innerJoin(products, eq(tasks.productId, products.id))
    .leftJoin(features, eq(tasks.primaryFeatureId, features.id))
    .leftJoin(contextPacks, eq(contextPacks.taskId, tasks.id))
    .where(eq(products.createdBy, userId))
    .orderBy(desc(tasks.updatedAt), desc(contextPacks.createdAt));
}

export async function getContextPacksForUser(userId: string, db: AppDb = defaultDb) {
  return db
    .select({
      pack: contextPacks,
      task: tasks,
      product: products,
      feature: features,
    })
    .from(contextPacks)
    .innerJoin(tasks, eq(contextPacks.taskId, tasks.id))
    .innerJoin(products, eq(contextPacks.productId, products.id))
    .leftJoin(features, eq(tasks.primaryFeatureId, features.id))
    .where(eq(products.createdBy, userId))
    .orderBy(desc(contextPacks.createdAt));
}

export async function getContextPack(
  contextPackId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .select()
    .from(contextPacks)
    .where(and(eq(contextPacks.id, contextPackId), eq(contextPacks.productId, productId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getContextPackDetail(
  productId: string,
  contextPackId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const [detail] = await db
    .select({
      pack: contextPacks,
      task: tasks,
      product: products,
      feature: features,
    })
    .from(contextPacks)
    .innerJoin(tasks, eq(contextPacks.taskId, tasks.id))
    .innerJoin(products, eq(contextPacks.productId, products.id))
    .leftJoin(features, eq(tasks.primaryFeatureId, features.id))
    .where(and(eq(contextPacks.id, contextPackId), eq(contextPacks.productId, productId)))
    .limit(1);

  if (!detail) {
    return null;
  }

  const productModule = detail.feature
    ? (
        await db
          .select()
          .from(modules)
          .where(eq(modules.id, detail.feature.moduleId))
          .limit(1)
      )[0] ?? null
    : null;
  const itemRows = await db
    .select({
      item: contextPackItems,
      knowledgeItem: knowledgeItems,
    })
    .from(contextPackItems)
    .innerJoin(
      knowledgeItems,
      eq(contextPackItems.knowledgeItemId, knowledgeItems.id),
    )
    .where(eq(contextPackItems.contextPackId, contextPackId))
    .orderBy(desc(contextPackItems.relevanceScore));
  const knowledgeIds = itemRows.map((row) => row.knowledgeItem.id);
  const evidence = await getSourcesForKnowledge(knowledgeIds, db);

  return {
    ...detail,
    module: productModule,
    items: itemRows,
    evidence,
  };
}

async function generateContextPackForTask(
  taskId: string,
  productId: string,
  userId: string,
  taskIntent: TaskIntent,
  db: AppDb,
  retrieval: RetrievalFn,
) {
  const product = await assertProductOwnership(productId, userId, db);
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.productId, productId)))
    .limit(1);

  if (!task) {
    throw new Error("Task not found or not accessible.");
  }

  const feature = task.primaryFeatureId
    ? (
        await db
          .select()
          .from(features)
          .where(
            and(
              eq(features.id, task.primaryFeatureId),
              eq(features.productId, productId),
            ),
          )
          .limit(1)
      )[0] ?? null
    : null;
  const productModule = feature
    ? (
        await db
          .select()
          .from(modules)
          .where(and(eq(modules.id, feature.moduleId), eq(modules.productId, productId)))
          .limit(1)
      )[0] ?? null
    : null;
  const retrievalResult = await retrieval(
    {
      productId,
      userId,
      taskDescription: `${task.title}\n${task.description}`,
      primaryFeatureId: task.primaryFeatureId ?? undefined,
      includeDiagnostics: process.env.NODE_ENV === "development",
    },
    db,
  );
  const knowledgeIds = retrievalResult.results.map((result) => result.knowledgeItem.id);
  const evidence = await getSourcesForKnowledge(knowledgeIds, db);
  const sourceMap = new Map<string, typeof sources.$inferSelect[]>();

  for (const row of evidence) {
    const list = sourceMap.get(row.knowledgeItemId) ?? [];
    list.push(row.source);
    sourceMap.set(row.knowledgeItemId, list);
  }

  const memoryResults: ContextPackMemoryResult[] = retrievalResult.results.map(
    (result) => ({
      ...result,
      sources: sourceMap.get(result.knowledgeItem.id) ?? [],
    }),
  );
  const compileInput = {
    task: {
      title: task.title,
      description: task.description,
      taskIntent,
    },
    product,
    module: productModule,
    feature,
    results: memoryResults,
  };
  const latestPack = await db
    .select()
    .from(contextPacks)
    .where(and(eq(contextPacks.taskId, taskId), eq(contextPacks.productId, productId)))
    .orderBy(desc(contextPacks.version))
    .limit(1);
  const version = (latestPack[0]?.version ?? 0) + 1;
  const [pack] = await db
    .insert(contextPacks)
    .values({
      taskId,
      productId,
      version,
      generatedContent: compileContextPack(compileInput),
      metadata: getContextPackMetadata(compileInput),
      createdBy: userId,
    })
    .returning();

  if (retrievalResult.results.length) {
    await db.insert(contextPackItems).values(
      retrievalResult.results.map((result) => ({
        contextPackId: pack.id,
        knowledgeItemId: result.knowledgeItem.id,
        relevanceScore: Math.round(result.finalScore * 100),
        reasonForInclusion: result.reasonForInclusion,
      })),
    ).onConflictDoNothing();
  }

  await db
    .update(tasks)
    .set({
      status: "packed",
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  return pack;
}

async function assertFeatureBelongsToProduct(
  productId: string,
  featureId: string,
  db: AppDb,
) {
  const rows = await db
    .select({ id: features.id })
    .from(features)
    .where(and(eq(features.id, featureId), eq(features.productId, productId)))
    .limit(1);

  if (!rows.length) {
    throw new Error("Primary feature is not accessible for this product.");
  }
}

async function getSourcesForKnowledge(knowledgeIds: string[], db: AppDb) {
  if (!knowledgeIds.length) {
    return [];
  }

  return db
    .select({
      knowledgeItemId: knowledgeSources.knowledgeItemId,
      source: sources,
    })
    .from(knowledgeSources)
    .innerJoin(sources, eq(knowledgeSources.sourceId, sources.id))
    .where(inArray(knowledgeSources.knowledgeItemId, knowledgeIds));
}
