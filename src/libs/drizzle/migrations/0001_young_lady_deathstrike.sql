DROP TABLE "preferences" CASCADE;--> statement-breakpoint
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_path_unique";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "path";