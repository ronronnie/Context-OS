import { count, desc, eq } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import { productIdAndOwnershipCondition, productOwnershipCondition, requireUserId } from "@/db/queries/authorization";
import {
  contextPacks,
  features,
  knowledgeItems,
  modules,
  products,
  tasks,
} from "@/db/schema/index";

export async function getProductsForUser(userId: string, db: AppDb = defaultDb) {
  return db
    .select()
    .from(products)
    .where(productOwnershipCondition(requireUserId(userId)))
    .orderBy(desc(products.updatedAt));
}

export async function getProduct(
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const rows = await db
    .select()
    .from(products)
    .where(productIdAndOwnershipCondition(productId, requireUserId(userId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function createProduct(
  input: { name: string; description: string },
  userId: string,
  db: AppDb = defaultDb,
) {
  const rows = await db
    .insert(products)
    .values({
      name: input.name,
      description: input.description,
      createdBy: requireUserId(userId),
    })
    .returning();

  return rows[0];
}

export async function updateProduct(
  productId: string,
  input: { name: string; description: string },
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .update(products)
    .set({
      name: input.name,
      description: input.description,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId))
    .returning();

  return rows[0] ?? null;
}

export async function getProductSummary(
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const product = await assertProductOwnership(productId, userId, db);
  const [moduleCountRow] = await db
    .select({ value: count() })
    .from(modules)
    .where(eq(modules.productId, productId));
  const [featureCountRow] = await db
    .select({ value: count() })
    .from(features)
    .where(eq(features.productId, productId));
  const [knowledgeCountRow] = await db
    .select({ value: count() })
    .from(knowledgeItems)
    .where(eq(knowledgeItems.productId, productId));
  const [contextPackCountRow] = await db
    .select({ value: count() })
    .from(contextPacks)
    .where(eq(contextPacks.productId, productId));
  const recentKnowledge = await db
    .select()
    .from(knowledgeItems)
    .where(eq(knowledgeItems.productId, productId))
    .orderBy(desc(knowledgeItems.updatedAt))
    .limit(5);
  const recentContextPacks = await db
    .select({
      id: contextPacks.id,
      taskId: contextPacks.taskId,
      productId: contextPacks.productId,
      generatedContent: contextPacks.generatedContent,
      metadata: contextPacks.metadata,
      createdAt: contextPacks.createdAt,
      taskTitle: tasks.title,
    })
    .from(contextPacks)
    .innerJoin(tasks, eq(contextPacks.taskId, tasks.id))
    .where(eq(contextPacks.productId, productId))
    .orderBy(desc(contextPacks.createdAt))
    .limit(5);

  return {
    product,
    counts: {
      modules: moduleCountRow?.value ?? 0,
      features: featureCountRow?.value ?? 0,
      knowledge: knowledgeCountRow?.value ?? 0,
      contextPacks: contextPackCountRow?.value ?? 0,
    },
    recentKnowledge,
    recentContextPacks,
  };
}

export async function assertProductOwnership(
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const product = await getProduct(productId, requireUserId(userId), db);

  if (!product) {
    throw new Error("Product not found or not accessible.");
  }

  return product;
}

export function unsafeProductIdConditionForTests(productId: string) {
  return eq(products.id, productId);
}
