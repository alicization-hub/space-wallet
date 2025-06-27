CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"txid" text NOT NULL,
	"size" integer NOT NULL,
	"weight" integer NOT NULL,
	"fee" integer NOT NULL,
	"inputs" json NOT NULL,
	"outputs" json NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"timestamp" timestamp (6) with time zone NOT NULL,
	"confirmations" integer DEFAULT 0 NOT NULL,
	"block_hash" text,
	"block_height" integer,
	"block_index" integer,
	"block_time" integer,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone
);
--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_txid_index" ON "transactions" USING btree ("txid");