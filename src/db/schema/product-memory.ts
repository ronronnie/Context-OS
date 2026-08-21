import {
  index,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "@/db/schema/auth";

export const knowledgeTypeEnum = pgEnum("knowledge_type", [
  "current_behaviour",
  "product_rule",
  "business_rule",
  "ux_pattern",
  "technical_constraint",
  "permission",
  "decision",
  "rejected_approach",
  "known_issue",
  "research_insight",
  "component",
  "terminology",
]);

export const authorityEnum = pgEnum("authority", [
  "canonical",
  "high",
  "medium",
  "low",
  "unverified",
]);

export const lifecycleStatusEnum = pgEnum("lifecycle_status", [
  "proposed",
  "verified",
  "outdated",
  "rejected",
]);

export const featureStatusEnum = pgEnum("feature_status", [
  "active",
  "planned",
  "deprecated",
  "archived",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "draft",
  "ready",
  "packed",
  "archived",
]);

export const knowledgeEventTypeEnum = pgEnum("knowledge_event_type", [
  "created",
  "updated",
  "verified",
  "marked_outdated",
  "rejected",
  "decision_added",
  "rejected_approach_added",
]);

export const sourceExtractionStatusEnum = pgEnum("source_extraction_status", [
  "ready",
  "failed",
]);

export const extractionCandidateStatusEnum = pgEnum(
  "extraction_candidate_status",
  ["pending", "approved", "rejected"],
);

export const knowledgeConflictTypeEnum = pgEnum("knowledge_conflict_type", [
  "contradiction",
  "supersedes",
  "duplicate",
  "historical_as_current",
  "authority_mismatch",
]);

export const knowledgeConflictResolutionEnum = pgEnum(
  "knowledge_conflict_resolution",
  [
    "pending",
    "replace_existing",
    "keep_both",
    "mark_existing_outdated",
    "reject_new",
  ],
);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("products_created_by_name_unique").on(table.createdBy, table.name),
  index("products_created_by_idx").on(table.createdBy),
]);

export const modules = pgTable("modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("modules_product_id_name_unique").on(table.productId, table.name),
  index("modules_product_id_idx").on(table.productId),
]);

export const features = pgTable("features", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id").notNull().references(() => modules.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  status: featureStatusEnum("status").notNull().default("active"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("features_product_id_module_id_name_unique").on(
    table.productId,
    table.moduleId,
    table.name,
  ),
  index("features_product_id_idx").on(table.productId),
  index("features_module_id_idx").on(table.moduleId),
]);

export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id),
  moduleId: uuid("module_id").references(() => modules.id),
  featureId: uuid("feature_id").references(() => features.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  knowledgeType: knowledgeTypeEnum("knowledge_type").notNull(),
  authority: authorityEnum("authority").notNull().default("unverified"),
  confidence: integer("confidence").notNull().default(0),
  lifecycleStatus: lifecycleStatusEnum("lifecycle_status").notNull().default("proposed"),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("knowledge_items_product_id_title_unique").on(
    table.productId,
    table.title,
  ),
  index("knowledge_items_product_id_idx").on(table.productId),
  index("knowledge_items_module_id_idx").on(table.moduleId),
  index("knowledge_items_feature_id_idx").on(table.featureId),
  index("knowledge_items_type_idx").on(table.knowledgeType),
  index("knowledge_items_lifecycle_idx").on(table.lifecycleStatus),
]);

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id),
  moduleId: uuid("module_id").references(() => modules.id),
  featureId: uuid("feature_id").references(() => features.id),
  sourceType: text("source_type").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  rawContent: text("raw_content"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: text("created_by").notNull().references(() => user.id),
}, (table) => [
  uniqueIndex("sources_product_id_name_unique").on(table.productId, table.name),
  index("sources_product_id_idx").on(table.productId),
  index("sources_module_id_idx").on(table.moduleId),
  index("sources_feature_id_idx").on(table.featureId),
  index("sources_created_by_idx").on(table.createdBy),
]);

export const knowledgeSources = pgTable("knowledge_sources", {
  knowledgeItemId: uuid("knowledge_item_id").notNull().references(() => knowledgeItems.id, {
    onDelete: "cascade",
  }),
  sourceId: uuid("source_id").notNull().references(() => sources.id, {
    onDelete: "cascade",
  }),
}, (table) => [
  primaryKey({ columns: [table.knowledgeItemId, table.sourceId] }),
  index("knowledge_sources_source_id_idx").on(table.sourceId),
]);

export const sourceExtractions = pgTable("source_extractions", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id),
  sourceId: uuid("source_id").notNull().references(() => sources.id, {
    onDelete: "cascade",
  }),
  status: sourceExtractionStatusEnum("status").notNull().default("ready"),
  skippedClaims: jsonb("skipped_claims")
    .$type<Array<{ claim: string; reason: string }>>()
    .default([])
    .notNull(),
  errorMessage: text("error_message"),
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("source_extractions_product_id_idx").on(table.productId),
  index("source_extractions_source_id_idx").on(table.sourceId),
  index("source_extractions_created_by_idx").on(table.createdBy),
]);

export const sourceExtractionCandidates = pgTable("source_extraction_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  extractionId: uuid("extraction_id").notNull().references(() => sourceExtractions.id, {
    onDelete: "cascade",
  }),
  productId: uuid("product_id").notNull().references(() => products.id),
  sourceId: uuid("source_id").notNull().references(() => sources.id, {
    onDelete: "cascade",
  }),
  moduleId: uuid("module_id").references(() => modules.id),
  featureId: uuid("feature_id").references(() => features.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  knowledgeType: knowledgeTypeEnum("knowledge_type").notNull(),
  suggestedAuthority: authorityEnum("suggested_authority").notNull(),
  confidence: integer("confidence").notNull(),
  reasoningSummary: text("reasoning_summary").notNull().default(""),
  sourceEvidence: jsonb("source_evidence")
    .$type<Array<{ sourceId: string; supportingText: string }>>()
    .default([])
    .notNull(),
  potentialRelationships: jsonb("potential_relationships")
    .$type<string[]>()
    .default([])
    .notNull(),
  appearsHistorical: boolean("appears_historical").notNull().default(false),
  possibleConflicts: jsonb("possible_conflicts")
    .$type<string[]>()
    .default([])
    .notNull(),
  status: extractionCandidateStatusEnum("status").notNull().default("pending"),
  approvedKnowledgeItemId: uuid("approved_knowledge_item_id").references(
    () => knowledgeItems.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("source_extraction_candidates_extraction_id_idx").on(table.extractionId),
  index("source_extraction_candidates_product_id_idx").on(table.productId),
  index("source_extraction_candidates_source_id_idx").on(table.sourceId),
  index("source_extraction_candidates_status_idx").on(table.status),
]);

export const knowledgeConflicts = pgTable("knowledge_conflicts", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id),
  extractionId: uuid("extraction_id").notNull().references(() => sourceExtractions.id, {
    onDelete: "cascade",
  }),
  candidateId: uuid("candidate_id").notNull().references(
    () => sourceExtractionCandidates.id,
    { onDelete: "cascade" },
  ),
  existingKnowledgeItemId: uuid("existing_knowledge_item_id")
    .notNull()
    .references(() => knowledgeItems.id),
  conflictType: knowledgeConflictTypeEnum("conflict_type").notNull(),
  resolution: knowledgeConflictResolutionEnum("resolution")
    .notNull()
    .default("pending"),
  summary: text("summary").notNull(),
  existingSnapshot: jsonb("existing_snapshot")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  candidateSnapshot: jsonb("candidate_snapshot")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  resolvedBy: text("resolved_by").references(() => user.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("knowledge_conflicts_product_id_idx").on(table.productId),
  index("knowledge_conflicts_extraction_id_idx").on(table.extractionId),
  index("knowledge_conflicts_candidate_id_idx").on(table.candidateId),
  index("knowledge_conflicts_existing_knowledge_item_id_idx").on(
    table.existingKnowledgeItemId,
  ),
  index("knowledge_conflicts_resolution_idx").on(table.resolution),
]);

export const knowledgeRelationships = pgTable("knowledge_relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id),
  fromKnowledgeId: uuid("from_knowledge_id").notNull().references(() => knowledgeItems.id, {
    onDelete: "cascade",
  }),
  toKnowledgeId: uuid("to_knowledge_id").notNull().references(() => knowledgeItems.id, {
    onDelete: "cascade",
  }),
  relationshipType: text("relationship_type").notNull(),
  reason: text("reason").notNull().default(""),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("knowledge_relationships_unique").on(
    table.fromKnowledgeId,
    table.toKnowledgeId,
    table.relationshipType,
  ),
  index("knowledge_relationships_product_id_idx").on(table.productId),
  index("knowledge_relationships_from_idx").on(table.fromKnowledgeId),
  index("knowledge_relationships_to_idx").on(table.toKnowledgeId),
]);

export const knowledgeEvents = pgTable("knowledge_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id),
  featureId: uuid("feature_id").references(() => features.id),
  knowledgeItemId: uuid("knowledge_item_id").notNull().references(() => knowledgeItems.id),
  eventType: knowledgeEventTypeEnum("event_type").notNull(),
  fromLifecycleStatus: lifecycleStatusEnum("from_lifecycle_status"),
  toLifecycleStatus: lifecycleStatusEnum("to_lifecycle_status"),
  title: text("title").notNull(),
  note: text("note").notNull().default(""),
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("knowledge_events_product_id_idx").on(table.productId),
  index("knowledge_events_feature_id_idx").on(table.featureId),
  index("knowledge_events_knowledge_item_id_idx").on(table.knowledgeItemId),
]);

export const featureRelationships = pgTable("feature_relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id),
  fromFeatureId: uuid("from_feature_id").notNull().references(() => features.id, {
    onDelete: "cascade",
  }),
  toFeatureId: uuid("to_feature_id").notNull().references(() => features.id, {
    onDelete: "cascade",
  }),
  relationshipType: text("relationship_type").notNull(),
  reason: text("reason").notNull().default(""),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("feature_relationships_unique").on(
    table.fromFeatureId,
    table.toFeatureId,
    table.relationshipType,
  ),
  index("feature_relationships_product_id_idx").on(table.productId),
  index("feature_relationships_from_idx").on(table.fromFeatureId),
  index("feature_relationships_to_idx").on(table.toFeatureId),
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id),
  primaryFeatureId: uuid("primary_feature_id").references(() => features.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: taskStatusEnum("status").notNull().default("draft"),
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tasks_product_id_title_unique").on(table.productId, table.title),
  index("tasks_product_id_idx").on(table.productId),
  index("tasks_created_by_idx").on(table.createdBy),
]);

export const contextPacks = pgTable("context_packs", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => tasks.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  generatedContent: text("generated_content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("context_packs_task_id_unique").on(table.taskId),
  index("context_packs_task_id_idx").on(table.taskId),
  index("context_packs_product_id_idx").on(table.productId),
]);

export const contextPackItems = pgTable("context_pack_items", {
  contextPackId: uuid("context_pack_id").notNull().references(() => contextPacks.id, {
    onDelete: "cascade",
  }),
  knowledgeItemId: uuid("knowledge_item_id").notNull().references(() => knowledgeItems.id),
  relevanceScore: integer("relevance_score"),
  reasonForInclusion: text("reason_for_inclusion"),
}, (table) => [
  primaryKey({ columns: [table.contextPackId, table.knowledgeItemId] }),
  index("context_pack_items_knowledge_item_id_idx").on(table.knowledgeItemId),
]);

export type Product = typeof products.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type KnowledgeEvent = typeof knowledgeEvents.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type FeatureRelationship = typeof featureRelationships.$inferSelect;
export type KnowledgeRelationship = typeof knowledgeRelationships.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type ContextPack = typeof contextPacks.$inferSelect;
