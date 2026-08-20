import { describe, expect, it } from "vitest";

import { requireUserId } from "@/db/queries";
import {
  parseFeatureFormData,
  parseModuleFormData,
  parseProductFormData,
} from "@/lib/product-architecture/forms";
import { featureRoute, moduleRoute, productRoute } from "@/lib/routes";

describe("product architecture actions", () => {
  it("parses product creation input", () => {
    const form = new FormData();
    form.set("name", "Nextzen Demo");
    form.set("description", "Fictional product");

    expect(parseProductFormData(form)).toEqual({
      name: "Nextzen Demo",
      description: "Fictional product",
    });
  });

  it("parses module creation input with position", () => {
    const form = new FormData();
    form.set("name", "Progress Reporting");
    form.set("description", "Reporting workflows");
    form.set("position", "2");

    expect(parseModuleFormData(form)).toEqual({
      name: "Progress Reporting",
      description: "Reporting workflows",
      position: 2,
    });
  });

  it("parses feature creation input with status", () => {
    const form = new FormData();
    form.set("name", "Bulk Review");
    form.set("description", "Bulk workflow");
    form.set("position", "1");
    form.set("status", "planned");

    expect(parseFeatureFormData(form)).toEqual({
      name: "Bulk Review",
      description: "Bulk workflow",
      position: 1,
      status: "planned",
    });
  });

  it("requires authorization before Product Memory access", () => {
    expect(() => requireUserId("")).toThrow("Authenticated user id");
    expect(() => requireUserId("user-1")).not.toThrow();
  });

  it("builds stable product architecture routes", () => {
    expect(productRoute("product-1")).toBe("/products/product-1");
    expect(moduleRoute("product-1", "module-1")).toBe(
      "/products/product-1/modules/module-1",
    );
    expect(featureRoute("product-1", "module-1", "feature-1")).toBe(
      "/products/product-1/modules/module-1/features/feature-1",
    );
  });
});
