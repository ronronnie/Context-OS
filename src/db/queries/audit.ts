import { and, desc, eq } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import { assertProductOwnership } from "@/db/queries/products";
import { productAuditEvents } from "@/db/schema/index";

export type ProductAuditEventInput = Omit<
  typeof productAuditEvents.$inferInsert,
  "id" | "createdAt" | "createdBy"
>;

export async function recordProductAuditEvent(
  input: ProductAuditEventInput,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);

  const rows = await db
    .insert(productAuditEvents)
    .values({
      ...input,
      createdBy: userId,
    })
    .returning();

  return rows[0];
}

export async function getProductAuditTimeline(
  productId: string,
  userId: string,
  limit = 50,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(productAuditEvents)
    .where(eq(productAuditEvents.productId, productId))
    .orderBy(desc(productAuditEvents.createdAt))
    .limit(limit);
}

export async function getFeatureAuditTimeline(
  productId: string,
  featureId: string,
  userId: string,
  limit = 50,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(productAuditEvents)
    .where(
      and(
        eq(productAuditEvents.productId, productId),
        eq(productAuditEvents.featureId, featureId),
      ),
    )
    .orderBy(desc(productAuditEvents.createdAt))
    .limit(limit);
}

export function getAuditEventLabel(eventType: string) {
  return eventType.replaceAll("_", " ");
}
