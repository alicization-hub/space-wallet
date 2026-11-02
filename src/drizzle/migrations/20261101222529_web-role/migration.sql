DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_space') THEN
    CREATE ROLE "web_space" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  END IF;
END
$$;--> statement-breakpoint
REVOKE CREATE ON SCHEMA "public" FROM PUBLIC;--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO "web_space";--> statement-breakpoint
GRANT SELECT ("id", "slug", "name", "is_active", "created_at", "updated_at") ON "wallets" TO "web_space";--> statement-breakpoint
GRANT SELECT ("id", "wallet_id", "label", "purpose", "index", "balance", "is_active", "started_at", "created_at", "updated_at") ON "accounts" TO "web_space";--> statement-breakpoint
GRANT UPDATE ("balance", "updated_at") ON "accounts" TO "web_space";--> statement-breakpoint
GRANT SELECT ("id", "account_id", "label", "type", "index", "address", "is_used", "created_at", "updated_at") ON "addresses" TO "web_space";--> statement-breakpoint
GRANT UPDATE ("is_used", "updated_at") ON "addresses" TO "web_space";
