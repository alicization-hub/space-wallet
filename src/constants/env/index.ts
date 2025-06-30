import { ciphersSchema, dbSchema, envSchema, jwtSchema, rpcSchema } from './validator.zod'

export const ENV = envSchema.parse({
  APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  APP_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  API_GATEWAY: process.env.NEXT_PUBLIC_API_GATEWAY,
  TZ: process.env.NEXT_PUBLIC_APP_TZ
})

export const DB = dbSchema.parse({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  name: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
})

export const DATABASE_URL = `postgresql://${DB.user}:${DB.password}@${DB.host}:${DB.port}/${DB.name}`

export const RPC = rpcSchema.parse({
  protocol: process.env.RPC_PROTOCOL,
  hostname: process.env.RPC_HOST,
  port: process.env.RPC_PORT,
  username: process.env.RPC_USERNAME,
  password: process.env.RPC_PASSWORD
})

export const CIPHERS = ciphersSchema.parse({
  salt: process.env.CIPHER_SALT_LENGTH,
  key: process.env.CIPHER_KEY_LENGTH,
  nonce: process.env.CIPHER_NONCE_LENGTH,
  security: process.env.CIPHER_SECURITY_LEVEL,
  argon2: {
    iterations: process.env.CIPHER_ARGON2_ITERATIONS,
    parallelism: process.env.CIPHER_ARGON2_PARALLELISM
  }
})

export const JWT = jwtSchema.parse({
  secret: process.env.JWT_SECRET,
  issuer: process.env.JWT_ISS,
  ttl: process.env.JWT_TTL
})
