CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"label" text NOT NULL,
	"purpose" integer DEFAULT 84 NOT NULL,
	"index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"started_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone,
	CONSTRAINT "accounts_label_unique" UNIQUE("label")
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"confirmed" integer DEFAULT 0 NOT NULL,
	"unconfirmed" integer DEFAULT 0 NOT NULL,
	"immature" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"spendable" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone
);
--> statement-breakpoint
ALTER TABLE "balances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"label" text,
	"type" text NOT NULL,
	"index" integer DEFAULT 0 NOT NULL,
	"address" text NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone,
	CONSTRAINT "addresses_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"bio" text NOT NULL,
	"passkey" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone,
	CONSTRAINT "wallets_slug_unique" UNIQUE("slug"),
	CONSTRAINT "wallets_name_unique" UNIQUE("name"),
	CONSTRAINT "wallets_bio_unique" UNIQUE("bio")
);
--> statement-breakpoint
ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balances" ADD CONSTRAINT "balances_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_label_unique_index" ON "accounts" USING btree ("label");--> statement-breakpoint
CREATE INDEX "account_purpose_index" ON "accounts" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "account_index_index" ON "accounts" USING btree ("index");--> statement-breakpoint
CREATE INDEX "balance_account_index" ON "balances" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "address_account_index" ON "addresses" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "address_type_index" ON "addresses" USING btree ("type");--> statement-breakpoint
CREATE INDEX "address_index_index" ON "addresses" USING btree ("index");--> statement-breakpoint
CREATE UNIQUE INDEX "address_address_unique_index" ON "addresses" USING btree ("address");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_slug_unique_index" ON "wallets" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_name_unique_index" ON "wallets" USING btree ("name");