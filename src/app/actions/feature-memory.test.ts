import { describe, expect, it } from "vitest";

import {
  parseKnowledgeFormData,
  parseLifecycleTransitionFormData,
  parseSourceIds,
} from "@/lib/product-memory/forms";
import {
  groupKnowledgeItemsByType,
  validateLifecycleTransition,
} from "@/lib/product-memory/knowledge-model";

describe("feature memory forms and lifecycle", () => {
  it("parses create knowledge input with source associations", () => {
    const form = baseKnowledgeForm();
    form.append("sourceIds", "source-a");
    form.append("sourceIds", "source-b");

    const parsed = parseKnowledgeFormData(form);

    expect(parsed.title).toBe("Approval permissions");
    expect(parsed.lifecycleStatus).toBe("proposed");
    expect(parsed.sourceIds).toEqual(["source-a", "source-b"]);
  });

  it("parses edit knowledge input with dates", () => {
    const form = baseKnowledgeForm();
    form.set("validFrom", "2026-08-20T10:00");
    form.set("lastVerifiedAt", "2026-08-20T11:00");
    form.set("lifecycleStatus", "verified");

    const parsed = parseKnowledgeFormData(form);

    expect(parsed.validFrom).toBeInstanceOf(Date);
    expect(parsed.lastVerifiedAt).toBeInstanceOf(Date);
    expect(parsed.lifecycleStatus).toBe("verified");
  });

  it("validates supported lifecycle transitions", () => {
    expect(() =>
      validateLifecycleTransition({ from: "proposed", to: "verified" }),
    ).not.toThrow();
    expect(() =>
      validateLifecycleTransition({ from: "verified", to: "outdated" }),
    ).not.toThrow();
    expect(() =>
      validateLifecycleTransition({ from: "proposed", to: "rejected" }),
    ).not.toThrow();
  });

  it("requires confirmation before rejecting verified knowledge", () => {
    expect(() =>
      validateLifecycleTransition({ from: "verified", to: "rejected" }),
    ).toThrow("requires confirmation");
    expect(() =>
      validateLifecycleTransition({
        from: "verified",
        to: "rejected",
        confirmed: true,
      }),
    ).not.toThrow();
  });

  it("parses lifecycle transition forms", () => {
    const form = new FormData();
    form.set("targetStatus", "rejected");
    form.set("confirmRejected", "on");

    expect(parseLifecycleTransitionFormData(form)).toEqual({
      targetStatus: "rejected",
      confirmedRejected: true,
    });
  });

  it("parses source associations independently", () => {
    const form = new FormData();
    form.append("sourceIds", "source-a");
    form.append("sourceIds", "");

    expect(parseSourceIds(form)).toEqual(["source-a"]);
  });

  it("groups feature memory for rendering by product-memory type", () => {
    const groups = groupKnowledgeItemsByType([
      { id: "a", knowledgeType: "permission" },
      { id: "b", knowledgeType: "decision" },
      { id: "c", knowledgeType: "permission" },
    ]);

    expect(groups.permission.map((item) => item.id)).toEqual(["a", "c"]);
    expect(groups.decision.map((item) => item.id)).toEqual(["b"]);
    expect(groups.terminology).toEqual([]);
  });
});

function baseKnowledgeForm() {
  const form = new FormData();
  form.set("title", "Approval permissions");
  form.set("body", "Only assigned reviewers can approve reports.");
  form.set("knowledgeType", "permission");
  form.set("authority", "canonical");
  form.set("confidence", "91");
  form.set("lifecycleStatus", "proposed");
  form.set("validFrom", "");
  form.set("validUntil", "");
  form.set("lastVerifiedAt", "");
  return form;
}
