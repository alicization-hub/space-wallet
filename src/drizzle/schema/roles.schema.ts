import { pgRole } from "drizzle-orm/pg-core"

/**
 * What the web server logs in as. It can't read `bio` or `passkey`, and writes only what a sync needs.
 * The grants are in the `web-role` migration, because `drizzle-kit` doesn't manage grants.
 */
export const webRole = pgRole("web_space").existing()
