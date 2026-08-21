import { describe, expect, it } from "vitest";

import { createFeatureRelationship } from "@/db/queries/product-graph";
import {
  seedFeatureRelationships,
  seedKnowledgeRelationships,
} from "@/db/seed-data";
import type { AppDb } from "@/db";
import {
  featureRelationshipTypes,
  getGraphBucketForKnowledgeType,
  knowledgeRelationshipTypes,
  parseFeatureRelationshipFormData,
  parseKnowledgeRelationshipFormData,
} from "@/lib/product-graph/relationships";

describe("product graph relationships", () => {
  it("parses feature relationship creation input", () => {
    const form = new FormData();
    form.set("toFeatureId", "11111111-1111-4111-8111-111111111111");
    form.set("relationshipType", "reuses_pattern_from");
    form.set("reason", "Use the established bulk action pattern.");

    expect(parseFeatureRelationshipFormData(form)).toEqual({
      toFeatureId: "11111111-1111-4111-8111-111111111111",
      relationshipType: "reuses_pattern_from",
      reason: "Use the established bulk action pattern.",
    });
  });

  it("rejects unsupported knowledge relationship types", () => {
    const form = new FormData();
    form.set("toKnowledgeId", "11111111-1111-4111-8111-111111111111");
    form.set("relationshipType", "informs");
    form.set("reason", "Legacy seed type should not be accepted.");

    expect(() => parseKnowledgeRelationshipFormData(form)).toThrow();
  });

  it("classifies memory into graph buckets for rendering", () => {
    expect(getGraphBucketForKnowledgeType("component")).toBe("components");
    expect(getGraphBucketForKnowledgeType("decision")).toBe("decisions");
    expect(getGraphBucketForKnowledgeType("technical_constraint")).toBe("constraints");
    expect(getGraphBucketForKnowledgeType("current_behaviour")).toBe("memory");
  });

  it("keeps Nextzen demo relationships on supported graph types", () => {
    for (const relationship of seedFeatureRelationships) {
      expect(featureRelationshipTypes).toContain(relationship.relationshipType);
      expect(relationship.reason.length).toBeGreaterThan(20);
    }

    for (const relationship of seedKnowledgeRelationships) {
      expect(knowledgeRelationshipTypes).toContain(relationship.relationshipType);
      expect(relationship.reason.length).toBeGreaterThan(20);
    }
  });

  it("requires authorization before creating graph relationships", async () => {
    await expect(
      createFeatureRelationship(
        {
          productId: "11111111-1111-4111-8111-111111111111",
          fromFeatureId: "22222222-2222-4222-8222-222222222222",
          toFeatureId: "33333333-3333-4333-8333-333333333333",
          relationshipType: "depends_on",
        },
        "",
        {} as AppDb,
      ),
    ).rejects.toThrow("Authenticated user id");
  });
});
