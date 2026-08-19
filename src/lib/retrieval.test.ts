import { describe, expect, it } from "vitest";

import { demoKnowledge } from "./demo-data";
import { buildContextPack, rankKnowledgeForTask } from "./retrieval";

describe("rankKnowledgeForTask", () => {
  it("prioritizes verified bulk approval constraints for a bulk approval task", () => {
    const ranked = rankKnowledgeForTask(
      "Design bulk approval for expense exceptions",
      demoKnowledge,
    );

    expect(ranked[0]?.id).toBe("mem-001");
    expect(ranked[0]?.status).toBe("verified");
  });

  it("preserves unverified claims in the generated pack instead of hiding them", () => {
    const ranked = rankKnowledgeForTask(
      "Bulk approval permissions and confirmation",
      demoKnowledge,
    );
    const pack = buildContextPack("Bulk approval permissions", ranked.slice(0, 5));

    expect(pack).toContain("Needs Human Attention");
    expect(pack).toContain("needs_review");
  });
});
