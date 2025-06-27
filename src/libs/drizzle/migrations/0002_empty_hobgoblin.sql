ALTER TABLE "addresses" ALTER COLUMN "label" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "last_descriptor_range" integer DEFAULT 0 NOT NULL;