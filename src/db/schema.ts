import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const memoryStatusEnum = pgEnum("memory_status", [
  "draft",
  "needs_review",
  "verified",
  "superseded",
  "contradicted",
]);

export const memoryTypeEnum = pgEnum("memory_type", [
  "current_state",
  "decision",
  "history",
  "relationship",
  "constraint",
  "pattern",
]);

export const productObjectTypeEnum = pgEnum("product_object_type", [
  "flow",
  "screen",
  "component",
  "api",
  "role",
  "permission",
]);

export const relationTypeEnum = pgEnum("relation_type", [
  "depends_on",
  "contradicts",
  "supersedes",
  "duplicates",
  "informs",
  "blocks",
  "touches",
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "adr",
  "research",
  "policy",
  "design",
  "ticket",
  "code",
  "meeting",
  "manual_note",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
}, (table) => [
  uniqueIndex("user_email_unique").on(table.email),
]);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, {
    onDelete: "cascade",
  }),
  token: text("token").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
}, (table) => [
  uniqueIndex("session_token_unique").on(table.token),
  index("session_user_id_idx").on(table.userId),
]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, {
    onDelete: "cascade",
  }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
  scope: text("scope"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
}, (table) => [
  index("account_user_id_idx").on(table.userId),
]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }),
  updatedAt: timestamp("updatedAt", { withTimezone: true }),
}, (table) => [
  index("verification_identifier_idx").on(table.identifier),
]);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("products_slug_unique").on(table.slug),
]);

export const modules = pgTable("modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  ownerRole: text("owner_role"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("modules_product_slug_unique").on(table.productId, table.slug),
  index("modules_product_id_idx").on(table.productId),
]);

export const features = pgTable("features", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id").notNull().references(() => modules.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  summary: text("summary"),
  lifecycleState: text("lifecycle_state").notNull().default("current"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("features_module_slug_unique").on(table.moduleId, table.slug),
  index("features_module_id_idx").on(table.moduleId),
]);

export const productObjects = pgTable("product_objects", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, {
    onDelete: "cascade",
  }),
  featureId: uuid("feature_id").references(() => features.id, {
    onDelete: "set null",
  }),
  type: productObjectTypeEnum("type").notNull(),
  name: text("name").notNull(),
  externalRef: text("external_ref"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("product_objects_product_id_idx").on(table.productId),
  index("product_objects_feature_id_idx").on(table.featureId),
]);

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, {
    onDelete: "cascade",
  }),
  type: sourceTypeEnum("type").notNull(),
  title: text("title").notNull(),
  uri: text("uri"),
  author: text("author"),
  sourceDate: timestamp("source_date", { withTimezone: true }),
  authorityScore: integer("authority_score").notNull().default(50),
  freshnessScore: integer("freshness_score").notNull().default(50),
  contentHash: text("content_hash"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("sources_product_id_idx").on(table.productId),
  index("sources_type_idx").on(table.type),
]);

export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, {
    onDelete: "cascade",
  }),
  moduleId: uuid("module_id").references(() => modules.id, {
    onDelete: "set null",
  }),
  featureId: uuid("feature_id").references(() => features.id, {
    onDelete: "set null",
  }),
  type: memoryTypeEnum("type").notNull(),
  status: memoryStatusEnum("status").notNull().default("needs_review"),
  claim: text("claim").notNull(),
  rationale: text("rationale"),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  authorityScore: integer("authority_score").notNull().default(50),
  confidenceScore: integer("confidence_score").notNull().default(50),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedByUserId: text("verified_by_user_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("knowledge_product_id_idx").on(table.productId),
  index("knowledge_module_id_idx").on(table.moduleId),
  index("knowledge_feature_id_idx").on(table.featureId),
  index("knowledge_status_idx").on(table.status),
  index("knowledge_type_idx").on(table.type),
]);

export const knowledgeEvidence = pgTable("knowledge_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeId: uuid("knowledge_id").notNull().references(() => knowledgeItems.id, {
    onDelete: "cascade",
  }),
  sourceId: uuid("source_id").notNull().references(() => sources.id, {
    onDelete: "cascade",
  }),
  quote: text("quote"),
  locator: text("locator"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("knowledge_evidence_unique").on(table.knowledgeId, table.sourceId, table.locator),
  index("knowledge_evidence_knowledge_id_idx").on(table.knowledgeId),
  index("knowledge_evidence_source_id_idx").on(table.sourceId),
]);

export const knowledgeRelations = pgTable("knowledge_relations", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromKnowledgeId: uuid("from_knowledge_id").notNull().references(() => knowledgeItems.id, {
    onDelete: "cascade",
  }),
  toKnowledgeId: uuid("to_knowledge_id").notNull().references(() => knowledgeItems.id, {
    onDelete: "cascade",
  }),
  type: relationTypeEnum("type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("knowledge_relations_unique").on(
    table.fromKnowledgeId,
    table.toKnowledgeId,
    table.type,
  ),
  index("knowledge_relations_from_idx").on(table.fromKnowledgeId),
  index("knowledge_relations_to_idx").on(table.toKnowledgeId),
]);

export const memoryEmbeddings = pgTable("memory_embeddings", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeId: uuid("knowledge_id").notNull().references(() => knowledgeItems.id, {
    onDelete: "cascade",
  }),
  model: text("model").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("memory_embeddings_knowledge_model_unique").on(
    table.knowledgeId,
    table.model,
  ),
  index("memory_embeddings_embedding_hnsw").using(
    "hnsw",
    table.embedding.op("vector_cosine_ops"),
  ),
]);

export const contextTasks = pgTable("context_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, {
    onDelete: "cascade",
  }),
  requestedByUserId: text("requested_by_user_id"),
  taskText: text("task_text").notNull(),
  destination: text("destination").notNull().default("codex"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("context_tasks_product_id_idx").on(table.productId),
]);

export const contextPacks = pgTable("context_packs", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => contextTasks.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  markdown: text("markdown").notNull(),
  tokenEstimate: integer("token_estimate").notNull().default(0),
  exportedAt: timestamp("exported_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("context_packs_task_id_idx").on(table.taskId),
]);

export const contextPackItems = pgTable("context_pack_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  contextPackId: uuid("context_pack_id").notNull().references(() => contextPacks.id, {
    onDelete: "cascade",
  }),
  knowledgeId: uuid("knowledge_id").notNull().references(() => knowledgeItems.id, {
    onDelete: "cascade",
  }),
  rank: integer("rank").notNull(),
  retrievalScore: integer("retrieval_score").notNull(),
  includedBecause: text("included_because").notNull(),
}, (table) => [
  uniqueIndex("context_pack_items_unique").on(table.contextPackId, table.knowledgeId),
  index("context_pack_items_pack_id_idx").on(table.contextPackId),
]);

export const capturedDecisions = pgTable("captured_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, {
    onDelete: "cascade",
  }),
  contextPackId: uuid("context_pack_id").references(() => contextPacks.id, {
    onDelete: "set null",
  }),
  decision: text("decision").notNull(),
  reason: text("reason"),
  accepted: boolean("accepted").notNull().default(true),
  capturedByUserId: text("captured_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("captured_decisions_product_id_idx").on(table.productId),
  index("captured_decisions_context_pack_id_idx").on(table.contextPackId),
]);
