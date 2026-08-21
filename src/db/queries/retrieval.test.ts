import { describe, expect, it } from "vitest";

import type { AppDb } from "@/db";
import { retrieveProductContext } from "@/db/queries/retrieval";

describe("semantic retrieval service", () => {
  it("requires authorization before generating embeddings or querying vectors", async () => {
    await expect(
      retrieveProductContext(
        {
          productId: "11111111-1111-4111-8111-111111111111",
          userId: "",
          taskDescription: "I want to add bulk approval to Progress Report Review.",
        },
        {} as AppDb,
      ),
    ).rejects.toThrow("Authenticated user id");
  });
});
