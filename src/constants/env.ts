import { z } from 'zod'

const dirSchema = z.string().default('C:\\Workspace\\db')

const envSchema = z.object({
  APP_MODE: z.union([z.literal('production'), z.literal('development'), z.literal('local')]).default('local'),
  APP_NAME: z.string().default('project_name'),
  APP_BASE_URL: z.string().default('http://www.example.com'),
  API_GATEWAY: z.string().default('https://api.example.com'),
  TZ: z.string().default('Asia/Bangkok')
})

const rpcSchema = z.object({
  protocol: z.string().default('http'),
  hostname: z.string().default('127.0.0.1'),
  port: z.string().default('8332'),
  username: z.string().default('username'),
  password: z.string().default('password')
})

const jwtSchema = z.object({
  secret: z.string().default('your-secret-key'),
  ttl: z.string().default('1h')
})

export const DATABASE_DIR = dirSchema.parse(process.env.DATABASE_DIR)

export const ENV = envSchema.parse({
  APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  APP_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  API_GATEWAY: process.env.NEXT_PUBLIC_API_GATEWAY,
  TZ: process.env.NEXT_PUBLIC_APP_TZ
})

export const RPC = rpcSchema.parse({
  protocol: process.env.RPC_PROTOCOL,
  hostname: process.env.RPC_HOST,
  port: process.env.RPC_PORT,
  username: process.env.RPC_USERNAME,
  password: process.env.RPC_PASSWORD
})

export const JWT = jwtSchema.parse({
  secret: process.env.JWT_SECRET,
  ttl: process.env.JWT_TTL
})
