ALTER TABLE "features" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "features" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
UPDATE "features" SET "status" = 'active' WHERE "status" = 'current';--> statement-breakpoint
DROP TYPE "public"."feature_status";--> statement-breakpoint
CREATE TYPE "public"."feature_status" AS ENUM('active', 'planned', 'deprecated', 'archived');--> statement-breakpoint
ALTER TABLE "features" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."feature_status";--> statement-breakpoint
ALTER TABLE "features" ALTER COLUMN "status" SET DATA TYPE "public"."feature_status" USING "status"::"public"."feature_status";
