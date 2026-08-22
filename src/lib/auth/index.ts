import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { PRODUCT_NAME } from "@/config/product";
import { createDb } from "@/db";
import * as schema from "@/db/schema/index";
import { getAuthBaseURL, getTrustedOrigins } from "@/lib/auth/origins";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://context_os:context_os@localhost:5432/context_os";

export const auth = betterAuth({
  appName: PRODUCT_NAME,
  baseURL: getAuthBaseURL(),
  trustedOrigins: getTrustedOrigins(),
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
