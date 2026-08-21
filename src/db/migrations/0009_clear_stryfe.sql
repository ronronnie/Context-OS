DROP INDEX "context_packs_task_id_unique";--> statement-breakpoint
ALTER TABLE "context_packs" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "context_packs" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "context_packs" ADD CONSTRAINT "context_packs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "context_packs_task_id_version_unique" ON "context_packs" USING btree ("task_id","version");--> statement-breakpoint
CREATE INDEX "context_packs_created_by_idx" ON "context_packs" USING btree ("created_by");