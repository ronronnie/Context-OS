ALTER TABLE "feature_relationships" DROP CONSTRAINT "feature_relationships_from_feature_id_features_id_fk";
--> statement-breakpoint
ALTER TABLE "feature_relationships" DROP CONSTRAINT "feature_relationships_to_feature_id_features_id_fk";
--> statement-breakpoint
ALTER TABLE "knowledge_relationships" DROP CONSTRAINT "knowledge_relationships_from_knowledge_id_knowledge_items_id_fk";
--> statement-breakpoint
ALTER TABLE "knowledge_relationships" DROP CONSTRAINT "knowledge_relationships_to_knowledge_id_knowledge_items_id_fk";
--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD COLUMN "reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD COLUMN "reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "feature_relationships"
SET "product_id" = "features"."product_id"
FROM "features"
WHERE "feature_relationships"."from_feature_id" = "features"."id";--> statement-breakpoint
UPDATE "knowledge_relationships"
SET "product_id" = "knowledge_items"."product_id"
FROM "knowledge_items"
WHERE "knowledge_relationships"."from_knowledge_id" = "knowledge_items"."id";--> statement-breakpoint
ALTER TABLE "feature_relationships" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD CONSTRAINT "feature_relationships_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD CONSTRAINT "feature_relationships_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD CONSTRAINT "feature_relationships_from_feature_id_features_id_fk" FOREIGN KEY ("from_feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_relationships" ADD CONSTRAINT "feature_relationships_to_feature_id_features_id_fk" FOREIGN KEY ("to_feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_from_knowledge_id_knowledge_items_id_fk" FOREIGN KEY ("from_knowledge_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_to_knowledge_id_knowledge_items_id_fk" FOREIGN KEY ("to_knowledge_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feature_relationships_product_id_idx" ON "feature_relationships" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "knowledge_relationships_product_id_idx" ON "knowledge_relationships" USING btree ("product_id");
