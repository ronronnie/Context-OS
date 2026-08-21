CREATE TYPE "public"."task_outcome_status" AS ENUM('created', 'extracted', 'failed');--> statement-breakpoint
ALTER TYPE "public"."knowledge_type" ADD VALUE 'open_question' BEFORE 'research_insight';--> statement-breakpoint
CREATE TABLE "decision_capture_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outcome_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"context_pack_id" uuid,
	"source_id" uuid NOT NULL,
	"module_id" uuid,
	"feature_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"knowledge_type" "knowledge_type" NOT NULL,
	"suggested_authority" "authority" NOT NULL,
	"confidence" integer NOT NULL,
	"reasoning_summary" text DEFAULT '' NOT NULL,
	"source_evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"potential_relationships" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"possible_conflicts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "extraction_candidate_status" DEFAULT 'pending' NOT NULL,
	"approved_knowledge_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_task_links" (
	"knowledge_item_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"context_pack_id" uuid,
	"outcome_id" uuid,
	"link_type" text DEFAULT 'captured_from_outcome' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_task_links_knowledge_item_id_task_id_link_type_pk" PRIMARY KEY("knowledge_item_id","task_id","link_type")
);
--> statement-breakpoint
CREATE TABLE "task_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"context_pack_id" uuid,
	"module_id" uuid,
	"feature_id" uuid,
	"source_id" uuid,
	"summary" text NOT NULL,
	"final_decision_notes" text DEFAULT '' NOT NULL,
	"references" text DEFAULT '' NOT NULL,
	"pasted_outcome" text NOT NULL,
	"status" "task_outcome_status" DEFAULT 'created' NOT NULL,
	"error_message" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decision_capture_candidates" ADD CONSTRAINT "decision_capture_candidates_outcome_id_task_outcomes_id_fk" FOREIGN KEY ("outcome_id") REFERENCES "public"."task_outcomes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_capture_candidates" ADD CONSTRAINT "decision_capture_candidates_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_capture_candidates" ADD CONSTRAINT "decision_capture_candidates_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_capture_candidates" ADD CONSTRAINT "decision_capture_candidates_context_pack_id_context_packs_id_fk" FOREIGN KEY ("context_pack_id") REFERENCES "public"."context_packs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_capture_candidates" ADD CONSTRAINT "decision_capture_candidates_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_capture_candidates" ADD CONSTRAINT "decision_capture_candidates_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_capture_candidates" ADD CONSTRAINT "decision_capture_candidates_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_capture_candidates" ADD CONSTRAINT "decision_capture_candidates_approved_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("approved_knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_task_links" ADD CONSTRAINT "knowledge_task_links_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_task_links" ADD CONSTRAINT "knowledge_task_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_task_links" ADD CONSTRAINT "knowledge_task_links_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_task_links" ADD CONSTRAINT "knowledge_task_links_context_pack_id_context_packs_id_fk" FOREIGN KEY ("context_pack_id") REFERENCES "public"."context_packs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_task_links" ADD CONSTRAINT "knowledge_task_links_outcome_id_task_outcomes_id_fk" FOREIGN KEY ("outcome_id") REFERENCES "public"."task_outcomes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_task_links" ADD CONSTRAINT "knowledge_task_links_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_outcomes" ADD CONSTRAINT "task_outcomes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_outcomes" ADD CONSTRAINT "task_outcomes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_outcomes" ADD CONSTRAINT "task_outcomes_context_pack_id_context_packs_id_fk" FOREIGN KEY ("context_pack_id") REFERENCES "public"."context_packs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_outcomes" ADD CONSTRAINT "task_outcomes_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_outcomes" ADD CONSTRAINT "task_outcomes_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_outcomes" ADD CONSTRAINT "task_outcomes_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_outcomes" ADD CONSTRAINT "task_outcomes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "decision_capture_candidates_outcome_id_idx" ON "decision_capture_candidates" USING btree ("outcome_id");--> statement-breakpoint
CREATE INDEX "decision_capture_candidates_product_id_idx" ON "decision_capture_candidates" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "decision_capture_candidates_task_id_idx" ON "decision_capture_candidates" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "decision_capture_candidates_status_idx" ON "decision_capture_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_task_links_product_id_idx" ON "knowledge_task_links" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "knowledge_task_links_task_id_idx" ON "knowledge_task_links" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "knowledge_task_links_outcome_id_idx" ON "knowledge_task_links" USING btree ("outcome_id");--> statement-breakpoint
CREATE INDEX "task_outcomes_product_id_idx" ON "task_outcomes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "task_outcomes_task_id_idx" ON "task_outcomes" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_outcomes_context_pack_id_idx" ON "task_outcomes" USING btree ("context_pack_id");--> statement-breakpoint
CREATE INDEX "task_outcomes_feature_id_idx" ON "task_outcomes" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "task_outcomes_created_by_idx" ON "task_outcomes" USING btree ("created_by");