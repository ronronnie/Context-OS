import { describe, expect, it } from "vitest";

import { getAuthBaseURL, getTrustedOrigins } from "@/lib/auth/origins";

describe("auth origin configuration", () => {
  it("uses Better Auth URL as the canonical base URL", () => {
    expect(getAuthBaseURL({
      BETTER_AUTH_URL: "https://context-os.example",
      NEXT_PUBLIC_APP_URL: "https://public.example",
    })).toBe("https://context-os.example");
  });

  it("trusts local origins including alternate localhost ports", () => {
    const origins = getTrustedOrigins({
      NODE_ENV: "production",
      BETTER_AUTH_URL: "http://localhost:3000",
    });

    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://127.0.0.1:3001");
  });

  it("adds configured deployment origins", () => {
    expect(getTrustedOrigins({
      NODE_ENV: "production",
      BETTER_AUTH_URL: "https://context-os.example",
      BETTER_AUTH_TRUSTED_ORIGINS:
        "https://preview.context-os.example, https://app.context-os.example",
    })).toEqual([
      "https://context-os.example",
      "https://preview.context-os.example",
      "https://app.context-os.example",
    ]);
  });
});
