DROP INDEX "transactions_txid_index";--> statement-breakpoint
CREATE INDEX "transactions_txid_index" ON "transactions" USING btree ("txid");