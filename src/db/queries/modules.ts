import { and, asc, count, eq } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import { assertProductOwnership } from "@/db/queries/products";
import { features, knowledgeItems, modules } from "@/db/schema/index";

export async function getModulesForProduct(
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(modules)
    .where(eq(modules.productId, productId))
    .orderBy(asc(modules.position), asc(modules.name));
}

export async function getModulesWithFeatureCounts(
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const productModules = await getModulesForProduct(productId, userId, db);

  return Promise.all(
    productModules.map(async (module) => {
      const [featureCountRow] = await db
        .select({ value: count() })
        .from(features)
        .where(eq(features.moduleId, module.id));
      const [knowledgeCountRow] = await db
        .select({ value: count() })
        .from(knowledgeItems)
        .where(
          and(
            eq(knowledgeItems.productId, productId),
            eq(knowledgeItems.moduleId, module.id),
          ),
        );

      return {
        ...module,
        featureCount: featureCountRow?.value ?? 0,
        knowledgeCount: knowledgeCountRow?.value ?? 0,
      };
    }),
  );
}

export async function getModule(
  moduleId: string,
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .select()
    .from(modules)
    .where(and(eq(modules.id, moduleId), eq(modules.productId, productId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function createModule(
  input: {
    productId: string;
    name: string;
    description: string;
    position: number;
  },
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);

  const rows = await db
    .insert(modules)
    .values(input)
    .returning();

  return rows[0];
}

export async function updateModule(
  moduleId: string,
  productId: string,
  input: { name: string; description: string; position: number },
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  const rows = await db
    .update(modules)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(modules.id, moduleId), eq(modules.productId, productId)))
    .returning();

  return rows[0] ?? null;
}
