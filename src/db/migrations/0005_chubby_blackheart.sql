CREATE TYPE "public"."extraction_candidate_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."source_extraction_status" AS ENUM('ready', 'failed');--> statement-breakpoint
CREATE TABLE "source_extraction_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"extraction_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
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
	"appears_historical" boolean DEFAULT false NOT NULL,
	"possible_conflicts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "extraction_candidate_status" DEFAULT 'pending' NOT NULL,
	"approved_knowledge_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_extractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"status" "source_extraction_status" DEFAULT 'ready' NOT NULL,
	"skipped_claims" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error_message" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_extraction_candidates" ADD CONSTRAINT "source_extraction_candidates_extraction_id_source_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."source_extractions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_extraction_candidates" ADD CONSTRAINT "source_extraction_candidates_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_extraction_candidates" ADD CONSTRAINT "source_extraction_candidates_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_extraction_candidates" ADD CONSTRAINT "source_extraction_candidates_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_extraction_candidates" ADD CONSTRAINT "source_extraction_candidates_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_extraction_candidates" ADD CONSTRAINT "source_extraction_candidates_approved_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("approved_knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_extractions" ADD CONSTRAINT "source_extractions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_extractions" ADD CONSTRAINT "source_extractions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_extractions" ADD CONSTRAINT "source_extractions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_extraction_candidates_extraction_id_idx" ON "source_extraction_candidates" USING btree ("extraction_id");--> statement-breakpoint
CREATE INDEX "source_extraction_candidates_product_id_idx" ON "source_extraction_candidates" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "source_extraction_candidates_source_id_idx" ON "source_extraction_candidates" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_extraction_candidates_status_idx" ON "source_extraction_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "source_extractions_product_id_idx" ON "source_extractions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "source_extractions_source_id_idx" ON "source_extractions" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_extractions_created_by_idx" ON "source_extractions" USING btree ("created_by");