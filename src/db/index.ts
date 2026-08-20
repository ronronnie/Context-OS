import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema/index";

export function createDb(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  return drizzle(neon(databaseUrl), { schema });
}

export const db = createDb(
  process.env.DATABASE_URL ??
    "postgres://context_os:context_os@localhost:5432/context_os",
);

export type AppDb = ReturnType<typeof createDb>;
