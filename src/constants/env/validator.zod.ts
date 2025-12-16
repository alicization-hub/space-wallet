import { z } from 'zod'

export const envSchema = z.object({
  APP_MODE: z.union([z.literal('production'), z.literal('development'), z.literal('local')]).default('local'),
  APP_NAME: z.string().default('project_name'),
  APP_BASE_URL: z.string().default('http://www.example.com'),
  API_GATEWAY: z.string().default('https://api.example.com'),
  TZ: z.string().default('Asia/Singapore')
})

export const dbSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.string().default('5432'),
  name: z.string().default('postgres'),
  user: z.string().default('postgres'),
  password: z.string().default('password')
})

export const rpcSchema = z.object({
  protocol: z.string().default('http'),
  hostname: z.string().default('127.0.0.1'),
  port: z.string().default('8332'),
  username: z.string().default('username'),
  password: z.string().default('password')
})

export const cipherSchema = z.object({
  algorithm: z
    .union([z.literal('aes-128-gcm'), z.literal('aes-192-gcm'), z.literal('aes-256-gcm')])
    .default('aes-128-gcm'),
  secret: z.string().default('your-secret-key'),
  iv: z.string().transform((value) => parseInt(value)),
  salt: z.string().transform((value) => parseInt(value)),
  key: z.string().transform((value) => parseInt(value)),
  nonce: z.string().transform((value) => parseInt(value)),
  security: z.string().transform((value) => Math.pow(2, parseInt(value))),
  argon2: z.object({
    iterations: z.string().transform((value) => parseInt(value)),
    parallelism: z.string().transform((value) => parseInt(value))
  })
})

export const jwtSchema = z.object({
  secret: z.string().default('your-secret-key'),
  issuer: z.string().default('your-issuer'),
  ttl: z.string().default('1h')
})
