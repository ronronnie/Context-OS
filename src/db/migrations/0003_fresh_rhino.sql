CREATE TYPE "public"."knowledge_event_type" AS ENUM('created', 'updated', 'verified', 'marked_outdated', 'rejected', 'decision_added', 'rejected_approach_added');--> statement-breakpoint
CREATE TABLE "knowledge_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"feature_id" uuid,
	"knowledge_item_id" uuid NOT NULL,
	"event_type" "knowledge_event_type" NOT NULL,
	"from_lifecycle_status" "lifecycle_status",
	"to_lifecycle_status" "lifecycle_status",
	"title" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_events" ADD CONSTRAINT "knowledge_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_events" ADD CONSTRAINT "knowledge_events_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_events" ADD CONSTRAINT "knowledge_events_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_events" ADD CONSTRAINT "knowledge_events_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_events_product_id_idx" ON "knowledge_events" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "knowledge_events_feature_id_idx" ON "knowledge_events" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "knowledge_events_knowledge_item_id_idx" ON "knowledge_events" USING btree ("knowledge_item_id");