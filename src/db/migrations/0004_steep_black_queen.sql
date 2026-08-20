ALTER TABLE "sources" ADD COLUMN "module_id" uuid;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "feature_id" uuid;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sources_module_id_idx" ON "sources" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "sources_feature_id_idx" ON "sources" USING btree ("feature_id");