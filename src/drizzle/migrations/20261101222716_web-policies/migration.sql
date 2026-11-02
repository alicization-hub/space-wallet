CREATE POLICY "account_web_read" ON "accounts" AS PERMISSIVE FOR SELECT TO "web_space" USING (true);--> statement-breakpoint
CREATE POLICY "account_web_update" ON "accounts" AS PERMISSIVE FOR UPDATE TO "web_space" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "address_web_read" ON "addresses" AS PERMISSIVE FOR SELECT TO "web_space" USING (true);--> statement-breakpoint
CREATE POLICY "address_web_mark_used" ON "addresses" AS PERMISSIVE FOR UPDATE TO "web_space" USING (not "addresses"."is_used") WITH CHECK ("addresses"."is_used");--> statement-breakpoint
CREATE POLICY "wallet_web_read" ON "wallets" AS PERMISSIVE FOR SELECT TO "web_space" USING (true);