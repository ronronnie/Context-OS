import { describe, expect, it, vi } from "vitest";

import type { AppDb } from "@/db";
import {
  getProductAuditTimeline,
  recordProductAuditEvent,
} from "@/db/queries/audit";
import type { Product, ProductAuditEvent } from "@/db/schema";

describe("audit queries", () => {
  it("persists audit events after product authorization", async () => {
    const insertedEvent = auditEventRecord();
    const values = vi.fn(() => ({
      returning: vi.fn(async () => [insertedEvent]),
    }));
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => [productRecord()]),
          })),
        })),
      })),
      insert: vi.fn(() => ({ values })),
    } as unknown as AppDb;

    const event = await recordProductAuditEvent(
      {
        productId: "product-1",
        sourceId: "source-1",
        eventType: "source_created",
        title: "Source created: Approval PRD",
        summary: "Source added.",
        metadata: { sourceType: "prd" },
      },
      "user-1",
      db,
    );

    expect(event).toEqual(insertedEvent);
    expect(values).toHaveBeenCalledWith({
      productId: "product-1",
      sourceId: "source-1",
      eventType: "source_created",
      title: "Source created: Approval PRD",
      summary: "Source added.",
      metadata: { sourceType: "prd" },
      createdBy: "user-1",
    });
  });

  it("requires authorization before reading or writing audit events", async () => {
    await expect(
      recordProductAuditEvent(
        {
          productId: "product-1",
          eventType: "context_pack_generated",
          title: "Pack generated",
          summary: "Generated.",
          metadata: {},
        },
        "",
        {} as AppDb,
      ),
    ).rejects.toThrow("Authenticated user id");

    await expect(
      getProductAuditTimeline("product-1", "", 10, {} as AppDb),
    ).rejects.toThrow("Authenticated user id");
  });
});

function productRecord(): Product {
  return {
    id: "product-1",
    name: "Nextzen Demo",
    description: "Fictional product.",
    createdBy: "user-1",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  };
}

function auditEventRecord(): ProductAuditEvent {
  return {
    id: "audit-1",
    productId: "product-1",
    moduleId: null,
    featureId: null,
    sourceId: "source-1",
    knowledgeItemId: null,
    taskId: null,
    contextPackId: null,
    outcomeId: null,
    sourceExtractionId: null,
    sourceExtractionCandidateId: null,
    decisionCaptureCandidateId: null,
    conflictId: null,
    eventType: "source_created",
    title: "Source created: Approval PRD",
    summary: "Source added.",
    metadata: { sourceType: "prd" },
    createdBy: "user-1",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
  };
}
