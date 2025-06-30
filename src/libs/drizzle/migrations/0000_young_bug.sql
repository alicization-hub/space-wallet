CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"label" text NOT NULL,
	"purpose" integer NOT NULL,
	"index" integer NOT NULL,
	"balance" json NOT NULL,
	"last_sync_height" integer NOT NULL,
	"last_descriptor_range" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"label" text,
	"address" text NOT NULL,
	"type" text NOT NULL,
	"index" integer NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone,
	CONSTRAINT "addresses_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"txid" text NOT NULL,
	"size" integer NOT NULL,
	"weight" integer NOT NULL,
	"amount" integer NOT NULL,
	"fee" integer NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"inputs" json NOT NULL,
	"outputs" json NOT NULL,
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
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"bio" text NOT NULL,
	"passkey" text NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone,
	CONSTRAINT "wallets_slug_unique" UNIQUE("slug"),
	CONSTRAINT "wallets_name_unique" UNIQUE("name"),
	CONSTRAINT "wallets_bio_unique" UNIQUE("bio")
);
--> statement-breakpoint
ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_label_index" ON "accounts" USING btree ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_address_index" ON "addresses" USING btree ("address");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_txid_index" ON "transactions" USING btree ("txid");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_slug_index" ON "wallets" USING btree ("slug");