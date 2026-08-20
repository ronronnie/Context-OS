const localTrustedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

export function getAuthBaseURL(env: Record<string, string | undefined> = process.env) {
  return env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getTrustedOrigins(
  env: Record<string, string | undefined> = process.env,
) {
  const configuredOrigins = splitOrigins(env.BETTER_AUTH_TRUSTED_ORIGINS);
  const baseURL = getAuthBaseURL(env);
  const appURL = env.NEXT_PUBLIC_APP_URL;
  const developmentOrigins = isLocalOrigin(baseURL) ? localTrustedOrigins : [];

  return Array.from(
    new Set(
      [baseURL, appURL, ...developmentOrigins, ...configuredOrigins].filter(
        Boolean,
      ) as string[],
    ),
  );
}

function splitOrigins(value: string | undefined) {
  return value
    ? value.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];
}

function isLocalOrigin(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
