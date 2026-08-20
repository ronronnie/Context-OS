import { describe, expect, it } from "vitest";

import { productIdAndOwnershipCondition, requireUserId } from "@/db/queries/authorization";
import {
  seedFeatures,
  seedKnowledge,
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
    expect(seedModules.map((module) => module.name)).toEqual([
      "Progress Reporting",
      "Application Review",
    ]);

    const moduleKeys = new Set(seedModules.map((module) => module.key));
    const featureKeys = new Set(seedFeatures.map((feature) => feature.key));

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
    }
  });
});
