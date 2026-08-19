import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

export function createDb(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to Neon Postgres.");
  }

  const client = neon(databaseUrl);
  return drizzle(client, { schema });
}

export type AppDb = ReturnType<typeof createDb>;
