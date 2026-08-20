import { eq } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import { assertProductOwnership } from "@/db/queries/products";
import { contextPacks, tasks } from "@/db/schema/index";

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
    .where(eq(contextPacks.id, contextPackId))
    .limit(1);

  const pack = rows[0] ?? null;
  return pack?.productId === productId ? pack : null;
}
