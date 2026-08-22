import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("query security boundaries", () => {
  it("keeps vector retrieval inside the authorized product boundary", () => {
    const source = readQuery("retrieval.ts");

    expect(source).toContain("await assertProductOwnership(input.productId, input.userId, db)");
    expect(source).toContain("eq(knowledgeEmbeddings.productId, input.productId)");
    expect(source).toContain("eq(knowledgeItems.productId, input.productId)");
    expect(source).toContain("eq(knowledgeRelationships.productId, productId)");
  });

  it("repeats product boundaries when expanding Context Pack detail", () => {
    const source = readQuery("tasks.ts");

    expect(source).toContain("eq(contextPackItems.contextPackId, contextPackId)");
    expect(source).toContain("eq(knowledgeItems.productId, productId)");
    expect(source).toContain("eq(taskOutcomes.productId, productId)");
    expect(source).toContain("eq(sources.productId, productId)");
  });

  it("repeats product boundaries for evidence, review candidates, and graph expansion", () => {
    const knowledge = readQuery("knowledge.ts");
    const sources = readQuery("sources.ts");
    const sourceExtractions = readQuery("source-extractions.ts");
    const decisionCapture = readQuery("decision-capture.ts");
    const productIntelligence = readQuery("product-intelligence.ts");

    expect(knowledge).toContain("eq(sources.productId, productId)");
    expect(knowledge).toContain("eq(knowledgeEvents.productId, productId)");
    expect(sources).toContain("eq(knowledgeItems.productId, productId)");
    expect(sourceExtractions).toContain("eq(sourceExtractionCandidates.productId, productId)");
    expect(sourceExtractions).toContain("eq(knowledgeConflicts.productId, productId)");
    expect(sourceExtractions).toContain("eq(featureRelationships.productId, productId)");
    expect(decisionCapture).toContain("eq(decisionCaptureCandidates.productId, productId)");
    expect(decisionCapture).toContain("eq(knowledgeItems.productId, productId)");
    expect(productIntelligence).toContain("eq(features.productId, productId)");
    expect(productIntelligence).toContain("eq(knowledgeItems.productId, productId)");
    expect(productIntelligence).toContain("eq(sources.productId, productId)");
  });
});

function readQuery(fileName: string) {
  return readFileSync(join(process.cwd(), "src/db/queries", fileName), "utf8");
}
