import { describe, expect, it } from "vitest";

import { productIdAndOwnershipCondition, requireUserId } from "@/db/queries/authorization";
import {
  seedFeatures,
  seedFeatureRelationships,
  seedDemoTask,
  seedKnowledge,
  seedKnowledgeRelationships,
  seedModules,
  seedProduct,
  seedSources,
} from "@/db/seed-data";

describe("Product Memory domain foundation", () => {
  it("requires an authenticated user id before data access", () => {
    expect(() => requireUserId("user-1")).not.toThrow();
    expect(() => requireUserId("")).toThrow("Authenticated user id");
    expect(() => requireUserId(undefined)).toThrow("Authenticated user id");
  });

  it("builds product ownership filters for service-layer queries", () => {
    const condition = productIdAndOwnershipCondition("product-1", "user-1");

    expect(condition).toBeDefined();
  });

  it("keeps seeded development data fictional and internally connected", () => {
    expect(seedProduct.name).toBe("Nextzen Demo");
    expect(seedProduct.description).toContain("fictional grants and program management");
    expect(seedModules.map((module) => module.name)).toEqual([
      "Progress Reporting",
      "Application Review",
      "Award Management",
      "Design System",
    ]);
    expect(seedFeatures.map((feature) => feature.name)).toEqual([
      "Create Progress Report",
      "Submit Progress Report",
      "Review Progress Report",
      "Approve Progress Report",
      "Request Corrections",
      "Application List",
      "Bulk Review",
      "Assign Reviewers",
      "Approve Application",
      "Award Dashboard",
      "Amendments",
      "Payments",
      "BulkActionBar",
      "ConfirmationModal",
      "StatusBadge",
      "DataTable",
      "Toast",
    ]);

    const moduleKeys: Set<string> = new Set(seedModules.map((module) => module.key));
    const featureKeys: Set<string> = new Set(seedFeatures.map((feature) => feature.key));
    const sourceKeys: Set<string> = new Set(seedSources.map((source) => source.key));
    const knowledgeTitles: Set<string> = new Set(seedKnowledge.map((item) => item.title));

    expect(seedKnowledge.length).toBeGreaterThanOrEqual(40);

    for (const feature of seedFeatures) {
      expect(moduleKeys.has(feature.moduleKey)).toBe(true);
    }

    for (const source of seedSources) {
      expect(moduleKeys.has(source.moduleKey)).toBe(true);
      if ("featureKey" in source) {
        expect(featureKeys.has(source.featureKey)).toBe(true);
      }
    }

    for (const item of seedKnowledge) {
      expect(featureKeys.has(item.featureKey)).toBe(true);
      expect(item.body).not.toMatch(/lorem ipsum/i);
      expect(item.body).not.toMatch(/joke|foobar|sample text/i);
      expect(item.sourceKeys.length).toBeGreaterThan(0);
      for (const sourceKey of item.sourceKeys) {
        expect(sourceKeys.has(sourceKey)).toBe(true);
      }
    }

    for (const relationship of seedFeatureRelationships) {
      expect(featureKeys.has(relationship.fromFeatureKey)).toBe(true);
      expect(featureKeys.has(relationship.toFeatureKey)).toBe(true);
    }

    for (const relationship of seedKnowledgeRelationships) {
      expect(knowledgeTitles.has(relationship.fromTitle)).toBe(true);
      expect(knowledgeTitles.has(relationship.toTitle)).toBe(true);
    }
  });

  it("seeds the expected bulk approval retrieval story", () => {
    const titles = new Set(seedKnowledge.map((item) => item.title));

    expect(seedDemoTask.title).toBe("Add bulk approval to Progress Report Review.");
    expect(seedDemoTask.contextPackKnowledgeTitles).toEqual([
      "Progress Report approval behavior",
      "Approval permissions are role-limited",
      "Compliance restrictions block invalid approvals",
      "Bulk mutation limit is 100 records",
      "Application Review bulk action pattern",
      "BulkActionBar is canonical bulk component",
      "ConfirmationModal is required for approvals",
      "Rejected persistent toolbar approach",
    ]);

    for (const title of seedDemoTask.contextPackKnowledgeTitles) {
      expect(titles.has(title)).toBe(true);
    }
  });

  it("keeps seed keys unique so the seed script is repeatable", () => {
    expect(uniqueCount(seedModules.map((module) => module.key))).toBe(seedModules.length);
    expect(uniqueCount(seedFeatures.map((feature) => feature.key))).toBe(seedFeatures.length);
    expect(uniqueCount(seedSources.map((source) => source.key))).toBe(seedSources.length);
    expect(uniqueCount(seedKnowledge.map((item) => item.title))).toBe(seedKnowledge.length);
  });
});

function uniqueCount(values: readonly string[]) {
  return new Set(values).size;
}
