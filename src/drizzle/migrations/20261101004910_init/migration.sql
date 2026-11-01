CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"wallet_id" uuid NOT NULL,
	"label" text NOT NULL,
	"purpose" integer NOT NULL,
	"index" integer NOT NULL,
	"balance" jsonb DEFAULT '{"confirmed":0,"unconfirmed":0,"immature":0,"total":0,"spendable":0}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "account_purpose_check" CHECK ("purpose" in (84, 86)),
	CONSTRAINT "account_index_check" CHECK ("index" >= 0)
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" uuid NOT NULL,
	"label" text,
	"type" text NOT NULL,
	"index" integer NOT NULL,
	"address" text NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "address_type_check" CHECK ("type" in ('receive', 'change')),
	CONSTRAINT "address_index_check" CHECK ("index" >= 0)
);
--> statement-breakpoint
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"bio" text NOT NULL,
	"passkey" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "account_label_unique_index" ON "accounts" ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "account_wallet_path_unique_index" ON "accounts" ("wallet_id","purpose","index");--> statement-breakpoint
CREATE UNIQUE INDEX "address_address_unique_index" ON "addresses" ("address");--> statement-breakpoint
CREATE UNIQUE INDEX "address_path_unique_index" ON "addresses" ("account_id","type","index");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_slug_unique_index" ON "wallets" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_name_unique_index" ON "wallets" ("name");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_wallet_id_wallets_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;