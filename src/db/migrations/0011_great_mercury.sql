CREATE TYPE "public"."product_audit_event_type" AS ENUM('source_created', 'extraction_run', 'candidate_approved', 'candidate_rejected', 'knowledge_edited', 'lifecycle_changed', 'conflict_resolved', 'context_pack_generated', 'decision_captured');--> statement-breakpoint
CREATE TABLE "product_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"module_id" uuid,
	"feature_id" uuid,
	"source_id" uuid,
	"knowledge_item_id" uuid,
	"task_id" uuid,
	"context_pack_id" uuid,
	"outcome_id" uuid,
	"source_extraction_id" uuid,
	"source_extraction_candidate_id" uuid,
	"decision_capture_candidate_id" uuid,
	"conflict_id" uuid,
	"event_type" "product_audit_event_type" NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_context_pack_id_context_packs_id_fk" FOREIGN KEY ("context_pack_id") REFERENCES "public"."context_packs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_outcome_id_task_outcomes_id_fk" FOREIGN KEY ("outcome_id") REFERENCES "public"."task_outcomes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_source_extraction_id_source_extractions_id_fk" FOREIGN KEY ("source_extraction_id") REFERENCES "public"."source_extractions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_source_extraction_candidate_id_source_extraction_candidates_id_fk" FOREIGN KEY ("source_extraction_candidate_id") REFERENCES "public"."source_extraction_candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_decision_capture_candidate_id_decision_capture_candidates_id_fk" FOREIGN KEY ("decision_capture_candidate_id") REFERENCES "public"."decision_capture_candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_conflict_id_knowledge_conflicts_id_fk" FOREIGN KEY ("conflict_id") REFERENCES "public"."knowledge_conflicts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_audit_events" ADD CONSTRAINT "product_audit_events_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_audit_events_product_id_idx" ON "product_audit_events" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_audit_events_module_id_idx" ON "product_audit_events" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "product_audit_events_feature_id_idx" ON "product_audit_events" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "product_audit_events_source_id_idx" ON "product_audit_events" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "product_audit_events_knowledge_item_id_idx" ON "product_audit_events" USING btree ("knowledge_item_id");--> statement-breakpoint
CREATE INDEX "product_audit_events_task_id_idx" ON "product_audit_events" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "product_audit_events_context_pack_id_idx" ON "product_audit_events" USING btree ("context_pack_id");--> statement-breakpoint
CREATE INDEX "product_audit_events_event_type_idx" ON "product_audit_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "product_audit_events_created_by_idx" ON "product_audit_events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "product_audit_events_created_at_idx" ON "product_audit_events" USING btree ("created_at");