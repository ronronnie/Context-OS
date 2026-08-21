import { describe, expect, it, vi } from "vitest";

import type { AppDb } from "@/db";
import {
  getProductIntelligenceOptions,
  runProductIntelligenceQuery,
} from "@/db/queries/product-intelligence";

describe("Product Intelligence services", () => {
  it("requires authorization before running a query", async () => {
    const provider = {
      generateText: vi.fn(),
      generateStructuredOutput: vi.fn(),
      generateEmbedding: vi.fn(),
    };

    await expect(
      runProductIntelligenceQuery(
        {
          productId: "11111111-1111-4111-8111-111111111111",
          moduleId: undefined,
          featureId: undefined,
          questionType: "change_impact",
          detail: "",
        },
        "",
        {} as AppDb,
        provider,
      ),
    ).rejects.toThrow("Authenticated user id");
    expect(provider.generateEmbedding).not.toHaveBeenCalled();
  });

  it("requires authorization before listing query options", async () => {
    const db = {
      select: vi.fn(() => {
        throw new Error("database should not be called without user id");
      }),
    };

    await expect(
      getProductIntelligenceOptions("", db as unknown as AppDb),
    ).rejects.toThrow("Authenticated user id");
  });
});
