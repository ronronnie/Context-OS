CREATE TYPE "public"."authority" AS ENUM('canonical', 'high', 'medium', 'low', 'unverified');--> statement-breakpoint
CREATE TYPE "public"."feature_status" AS ENUM('current', 'planned', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."knowledge_type" AS ENUM('current_behaviour', 'product_rule', 'business_rule', 'ux_pattern', 'technical_constraint', 'permission', 'decision', 'rejected_approach', 'known_issue', 'research_insight', 'component', 'terminology');--> statement-breakpoint
CREATE TYPE "public"."lifecycle_status" AS ENUM('proposed', 'verified', 'outdated', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('draft', 'ready', 'packed', 'archived');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"idToken" text,
	"password" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "context_pack_items" (
	"context_pack_id" uuid NOT NULL,
	"knowledge_item_id" uuid NOT NULL,
	"relevance_score" integer,
	"reason_for_inclusion" text,
	CONSTRAINT "context_pack_items_context_pack_id_knowledge_item_id_pk" PRIMARY KEY("context_pack_id","knowledge_item_id")
);
--> statement-breakpoint
CREATE TABLE "context_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"generated_content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_feature_id" uuid NOT NULL,
	"to_feature_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "feature_status" DEFAULT 'current' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"module_id" uuid,
	"feature_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"knowledge_type" "knowledge_type" NOT NULL,
	"authority" "authority" DEFAULT 'unverified' NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"lifecycle_status" "lifecycle_status" DEFAULT 'proposed' NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_knowledge_id" uuid NOT NULL,
	"to_knowledge_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"knowledge_item_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	CONSTRAINT "knowledge_sources_knowledge_item_id_source_id_pk" PRIMARY KEY("knowledge_item_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"raw_content" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"primary_feature_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "task_status" DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_pack_items" ADD CONSTRAINT "context_pack_items_context_pack_id_context_packs_id_fk" FOREIGN KEY ("context_pack_id") REFERENCES "public"."context_packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_pack_items" ADD CONSTRAINT "context_pack_items_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_packs" ADD CONSTRAINT "context_packs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_packs" ADD CONSTRAINT "context_packs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD CONSTRAINT "feature_relationships_from_feature_id_features_id_fk" FOREIGN KEY ("from_feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD CONSTRAINT "feature_relationships_to_feature_id_features_id_fk" FOREIGN KEY ("to_feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "features" ADD CONSTRAINT "features_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "features" ADD CONSTRAINT "features_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_from_knowledge_id_knowledge_items_id_fk" FOREIGN KEY ("from_knowledge_id") REFERENCES "public"."knowledge_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_to_knowledge_id_knowledge_items_id_fk" FOREIGN KEY ("to_knowledge_id") REFERENCES "public"."knowledge_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_primary_feature_id_features_id_fk" FOREIGN KEY ("primary_feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "context_pack_items_knowledge_item_id_idx" ON "context_pack_items" USING btree ("knowledge_item_id");--> statement-breakpoint
CREATE INDEX "context_packs_task_id_idx" ON "context_packs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "context_packs_product_id_idx" ON "context_packs" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_relationships_unique" ON "feature_relationships" USING btree ("from_feature_id","to_feature_id","relationship_type");--> statement-breakpoint
CREATE INDEX "feature_relationships_from_idx" ON "feature_relationships" USING btree ("from_feature_id");--> statement-breakpoint
CREATE INDEX "feature_relationships_to_idx" ON "feature_relationships" USING btree ("to_feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "features_product_id_module_id_name_unique" ON "features" USING btree ("product_id","module_id","name");--> statement-breakpoint
CREATE INDEX "features_product_id_idx" ON "features" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "features_module_id_idx" ON "features" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "knowledge_items_product_id_idx" ON "knowledge_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "knowledge_items_module_id_idx" ON "knowledge_items" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "knowledge_items_feature_id_idx" ON "knowledge_items" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "knowledge_items_type_idx" ON "knowledge_items" USING btree ("knowledge_type");--> statement-breakpoint
CREATE INDEX "knowledge_items_lifecycle_idx" ON "knowledge_items" USING btree ("lifecycle_status");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_relationships_unique" ON "knowledge_relationships" USING btree ("from_knowledge_id","to_knowledge_id","relationship_type");--> statement-breakpoint
CREATE INDEX "knowledge_relationships_from_idx" ON "knowledge_relationships" USING btree ("from_knowledge_id");--> statement-breakpoint
CREATE INDEX "knowledge_relationships_to_idx" ON "knowledge_relationships" USING btree ("to_knowledge_id");--> statement-breakpoint
CREATE INDEX "knowledge_sources_source_id_idx" ON "knowledge_sources" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "modules_product_id_name_unique" ON "modules" USING btree ("product_id","name");--> statement-breakpoint
CREATE INDEX "modules_product_id_idx" ON "modules" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_created_by_name_unique" ON "products" USING btree ("created_by","name");--> statement-breakpoint
CREATE INDEX "products_created_by_idx" ON "products" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "sources_product_id_idx" ON "sources" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sources_created_by_idx" ON "sources" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "tasks_product_id_idx" ON "tasks" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "tasks_created_by_idx" ON "tasks" USING btree ("created_by");