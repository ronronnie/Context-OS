CREATE TYPE "public"."knowledge_conflict_resolution" AS ENUM('pending', 'replace_existing', 'keep_both', 'mark_existing_outdated', 'reject_new');--> statement-breakpoint
CREATE TYPE "public"."knowledge_conflict_type" AS ENUM('contradiction', 'supersedes', 'duplicate', 'historical_as_current', 'authority_mismatch');--> statement-breakpoint
CREATE TABLE "knowledge_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"extraction_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"existing_knowledge_item_id" uuid NOT NULL,
	"conflict_type" "knowledge_conflict_type" NOT NULL,
	"resolution" "knowledge_conflict_resolution" DEFAULT 'pending' NOT NULL,
	"summary" text NOT NULL,
	"existing_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"candidate_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_conflicts" ADD CONSTRAINT "knowledge_conflicts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_conflicts" ADD CONSTRAINT "knowledge_conflicts_extraction_id_source_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."source_extractions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_conflicts" ADD CONSTRAINT "knowledge_conflicts_candidate_id_source_extraction_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."source_extraction_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_conflicts" ADD CONSTRAINT "knowledge_conflicts_existing_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("existing_knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_conflicts" ADD CONSTRAINT "knowledge_conflicts_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_conflicts_product_id_idx" ON "knowledge_conflicts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "knowledge_conflicts_extraction_id_idx" ON "knowledge_conflicts" USING btree ("extraction_id");--> statement-breakpoint
CREATE INDEX "knowledge_conflicts_candidate_id_idx" ON "knowledge_conflicts" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "knowledge_conflicts_existing_knowledge_item_id_idx" ON "knowledge_conflicts" USING btree ("existing_knowledge_item_id");--> statement-breakpoint
CREATE INDEX "knowledge_conflicts_resolution_idx" ON "knowledge_conflicts" USING btree ("resolution");