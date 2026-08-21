import { describe, expect, it, vi } from "vitest";

import type { AppDb } from "@/db";
import { createTaskAndGenerateContextPack } from "@/db/queries/tasks";

describe("task and Context Pack services", () => {
  it("requires authorization before retrieval or persistence", async () => {
    const retrieval = vi.fn();

    await expect(
      createTaskAndGenerateContextPack(
        {
          productId: "11111111-1111-4111-8111-111111111111",
          title: "Add bulk approval",
          description: "I want to add bulk approval to Progress Report Review.",
          taskIntent: "design",
        },
        "",
        {} as AppDb,
        retrieval,
      ),
    ).rejects.toThrow("Authenticated user id");
    expect(retrieval).not.toHaveBeenCalled();
  });
});
