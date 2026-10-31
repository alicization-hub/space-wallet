import { z } from "zod"

export const envSchema = z.object({
  APP_MODE: z.enum(["production", "development", "local"]).default("local"),
  APP_NAME: z.string().default("project_name"),
  APP_BASE_URL: z.url().default("https://localhost:8338"),
  TZ: z.string().default("Asia/Singapore")
})

/**
 * Credentials have no default on purpose: a missing value must stop the app instead of silently
 * connecting with a well-known one.
 */
export const dbSchema = z.object({
  host: z.string().default("127.0.0.1"),
  port: z.string().default("5432"),
  name: z.string().nonempty(),
  user: z.string().nonempty(),
  password: z.string()
})

export const rpcSchema = z.object({
  protocol: z.enum(["http", "https"]).default("http"),
  hostname: z.string().default("127.0.0.1"),
  port: z.string().default("8332"),
  username: z.string().nonempty(),
  password: z.string().nonempty()
})

/**
 * `salt`, `nonce`, `key`, `security` and `argon2` shape the stored seed encryption (`wallets.bio`)
 * and aren't saved with the ciphertext. Changing them makes existing wallets undecryptable, so
 * re-encrypt first (`tests/utils.spec.ts`). The floors stop a value from silently weakening the key
 * derivation.
 */
export const cipherSchema = z.object({
  salt: z.coerce.number().int().min(16).max(64),
  key: z.coerce.number().pipe(z.literal(32)),
  nonce: z.coerce.number().pipe(z.literal(24)),
  security: z.coerce
    .number()
    .int()
    .min(15)
    .max(22)
    .transform((value) => Math.pow(2, value)),
  argon2: z.object({
    iterations: z.coerce.number().int().min(2),
    parallelism: z.coerce.number().int().min(1).max(8)
  })
})
