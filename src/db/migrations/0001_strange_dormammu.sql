CREATE UNIQUE INDEX "context_packs_task_id_unique" ON "context_packs" USING btree ("task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_items_product_id_title_unique" ON "knowledge_items" USING btree ("product_id","title");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_product_id_name_unique" ON "sources" USING btree ("product_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_product_id_title_unique" ON "tasks" USING btree ("product_id","title");