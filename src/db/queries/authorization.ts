import { and, eq } from "drizzle-orm";

import { products } from "@/db/schema/index";

export function requireUserId(userId: string | null | undefined) {
  if (!userId) {
    throw new Error("Authenticated user id is required for Product Memory access.");
  }

  return userId;
}

export function productOwnershipCondition(userId: string) {
  return eq(products.createdBy, requireUserId(userId));
}

export function productIdAndOwnershipCondition(productId: string, userId: string) {
  return and(eq(products.id, productId), productOwnershipCondition(userId));
}
