CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."memory_status" AS ENUM('draft', 'needs_review', 'verified', 'superseded', 'contradicted');--> statement-breakpoint
CREATE TYPE "public"."memory_type" AS ENUM('current_state', 'decision', 'history', 'relationship', 'constraint', 'pattern');--> statement-breakpoint
CREATE TYPE "public"."product_object_type" AS ENUM('flow', 'screen', 'component', 'api', 'role', 'permission');--> statement-breakpoint
CREATE TYPE "public"."relation_type" AS ENUM('depends_on', 'contradicts', 'supersedes', 'duplicates', 'informs', 'blocks', 'touches');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('adr', 'research', 'policy', 'design', 'ticket', 'code', 'meeting', 'manual_note');--> statement-breakpoint
CREATE TABLE "captured_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"context_pack_id" uuid,
	"decision" text NOT NULL,
	"reason" text,
	"accepted" boolean DEFAULT true NOT NULL,
	"captured_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "context_pack_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"context_pack_id" uuid NOT NULL,
	"knowledge_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"retrieval_score" integer NOT NULL,
	"included_because" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "context_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" text NOT NULL,
	"markdown" text NOT NULL,
	"token_estimate" integer DEFAULT 0 NOT NULL,
	"exported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "context_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"requested_by_user_id" text,
	"task_text" text NOT NULL,
	"destination" text DEFAULT 'codex' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"summary" text,
	"lifecycle_state" text DEFAULT 'current' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"quote" text,
	"locator" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"module_id" uuid,
	"feature_id" uuid,
	"type" "memory_type" NOT NULL,
	"status" "memory_status" DEFAULT 'needs_review' NOT NULL,
	"claim" text NOT NULL,
	"rationale" text,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"authority_score" integer DEFAULT 50 NOT NULL,
	"confidence_score" integer DEFAULT 50 NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_user_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_knowledge_id" uuid NOT NULL,
	"to_knowledge_id" uuid NOT NULL,
	"type" "relation_type" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_id" uuid NOT NULL,
	"model" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"owner_role" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"feature_id" uuid,
	"type" "product_object_type" NOT NULL,
	"name" text NOT NULL,
	"external_ref" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "source_type" NOT NULL,
	"title" text NOT NULL,
	"uri" text,
	"author" text,
	"source_date" timestamp with time zone,
	"authority_score" integer DEFAULT 50 NOT NULL,
	"freshness_score" integer DEFAULT 50 NOT NULL,
	"content_hash" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "captured_decisions" ADD CONSTRAINT "captured_decisions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_decisions" ADD CONSTRAINT "captured_decisions_context_pack_id_context_packs_id_fk" FOREIGN KEY ("context_pack_id") REFERENCES "public"."context_packs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_pack_items" ADD CONSTRAINT "context_pack_items_context_pack_id_context_packs_id_fk" FOREIGN KEY ("context_pack_id") REFERENCES "public"."context_packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_pack_items" ADD CONSTRAINT "context_pack_items_knowledge_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_packs" ADD CONSTRAINT "context_packs_task_id_context_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."context_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_tasks" ADD CONSTRAINT "context_tasks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "features" ADD CONSTRAINT "features_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_evidence" ADD CONSTRAINT "knowledge_evidence_knowledge_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_evidence" ADD CONSTRAINT "knowledge_evidence_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_relations" ADD CONSTRAINT "knowledge_relations_from_knowledge_id_knowledge_items_id_fk" FOREIGN KEY ("from_knowledge_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_relations" ADD CONSTRAINT "knowledge_relations_to_knowledge_id_knowledge_items_id_fk" FOREIGN KEY ("to_knowledge_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_embeddings" ADD CONSTRAINT "memory_embeddings_knowledge_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_objects" ADD CONSTRAINT "product_objects_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_objects" ADD CONSTRAINT "product_objects_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "captured_decisions_product_id_idx" ON "captured_decisions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "captured_decisions_context_pack_id_idx" ON "captured_decisions" USING btree ("context_pack_id");--> statement-breakpoint
CREATE UNIQUE INDEX "context_pack_items_unique" ON "context_pack_items" USING btree ("context_pack_id","knowledge_id");--> statement-breakpoint
CREATE INDEX "context_pack_items_pack_id_idx" ON "context_pack_items" USING btree ("context_pack_id");--> statement-breakpoint
CREATE INDEX "context_packs_task_id_idx" ON "context_packs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "context_tasks_product_id_idx" ON "context_tasks" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "features_module_slug_unique" ON "features" USING btree ("module_id","slug");--> statement-breakpoint
CREATE INDEX "features_module_id_idx" ON "features" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_evidence_unique" ON "knowledge_evidence" USING btree ("knowledge_id","source_id","locator");--> statement-breakpoint
CREATE INDEX "knowledge_evidence_knowledge_id_idx" ON "knowledge_evidence" USING btree ("knowledge_id");--> statement-breakpoint
CREATE INDEX "knowledge_evidence_source_id_idx" ON "knowledge_evidence" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "knowledge_product_id_idx" ON "knowledge_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "knowledge_module_id_idx" ON "knowledge_items" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "knowledge_feature_id_idx" ON "knowledge_items" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "knowledge_status_idx" ON "knowledge_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_type_idx" ON "knowledge_items" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_relations_unique" ON "knowledge_relations" USING btree ("from_knowledge_id","to_knowledge_id","type");--> statement-breakpoint
CREATE INDEX "knowledge_relations_from_idx" ON "knowledge_relations" USING btree ("from_knowledge_id");--> statement-breakpoint
CREATE INDEX "knowledge_relations_to_idx" ON "knowledge_relations" USING btree ("to_knowledge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memory_embeddings_knowledge_model_unique" ON "memory_embeddings" USING btree ("knowledge_id","model");--> statement-breakpoint
CREATE INDEX "memory_embeddings_embedding_hnsw" ON "memory_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "modules_product_slug_unique" ON "modules" USING btree ("product_id","slug");--> statement-breakpoint
CREATE INDEX "modules_product_id_idx" ON "modules" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_objects_product_id_idx" ON "product_objects" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_objects_feature_id_idx" ON "product_objects" USING btree ("feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_unique" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "sources_product_id_idx" ON "sources" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sources_type_idx" ON "sources" USING btree ("type");
