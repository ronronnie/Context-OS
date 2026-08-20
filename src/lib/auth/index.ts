import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { createDb } from "@/db";
import * as schema from "@/db/schema/index";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://context_os:context_os@localhost:5432/context_os";

export const auth = betterAuth({
  appName: "Context OS",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "context-os-development-secret-change-before-production",
  database: drizzleAdapter(createDb(databaseUrl), {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
});
