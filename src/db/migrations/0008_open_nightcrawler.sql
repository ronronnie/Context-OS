CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "knowledge_embeddings" (
	"knowledge_item_id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"embedding_model" text NOT NULL,
	"embedding_dimensions" integer NOT NULL,
	"content_hash" text NOT NULL,
	"embedded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_embeddings" ADD CONSTRAINT "knowledge_embeddings_knowledge_item_id_knowledge_items_id_fk" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_embeddings" ADD CONSTRAINT "knowledge_embeddings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_embeddings_product_id_idx" ON "knowledge_embeddings" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "knowledge_embeddings_model_idx" ON "knowledge_embeddings" USING btree ("embedding_model");--> statement-breakpoint
CREATE INDEX "knowledge_embeddings_embedded_at_idx" ON "knowledge_embeddings" USING btree ("embedded_at");
