import { createAuthClient } from "better-auth/react";

const developmentBaseURL =
  process.env.NODE_ENV === "development" && typeof window !== "undefined"
    ? window.location.origin
    : undefined;

export const authClient = createAuthClient({
  baseURL: developmentBaseURL ?? process.env.NEXT_PUBLIC_APP_URL,
});
