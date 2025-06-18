import { z } from 'zod'

export const envSchema = z.object({
  APP_MODE: z.union([z.literal('production'), z.literal('development'), z.literal('local')]).default('local'),
  APP_NAME: z.string().default('project_name'),
  APP_BASE_URL: z.string().default('http://www.example.com'),
  API_GATEWAY: z.string().default('https://api.example.com'),
  TZ: z.string().default('Asia/Bangkok')
})

export const dbSchema = z.object({
  dir: z.string().default('%APP_DATA%/Local/Bitcoin/Wallets'),
  passkey: z.string().default('passkey'),
  security: z
    .string()
    .default('18')
    .transform((value) => Math.pow(2, parseInt(value)))
})

export const rpcSchema = z.object({
  protocol: z.string().default('http'),
  hostname: z.string().default('127.0.0.1'),
  port: z.string().default('8332'),
  username: z.string().default('username'),
  password: z.string().default('password')
})

export const ciphersSchema = z.object({
  salt: z
    .string()
    .default('16')
    .transform((value) => parseInt(value)), // 16 bytes salt
  key: z
    .string()
    .default('32')
    .transform((value) => parseInt(value)), // 32 bytes key for XChaCha20
  nonce: z
    .string()
    .default('24')
    .transform((value) => parseInt(value)), // 24 bytes nonce for XChaCha20
  security: z
    .string()
    .default('20')
    .transform((value) => Math.pow(2, parseInt(value))), // requires 1GB of RAM to calculate
  argon2: z.object({
    iterations: z
      .string()
      .default('4')
      .transform((value) => parseInt(value)),
    parallelism: z
      .string()
      .default('1')
      .transform((value) => parseInt(value))
  })
})

export const jwtSchema = z.object({
  secret: z.string().default('your-secret-key'),
  ttl: z.string().default('1h')
})
