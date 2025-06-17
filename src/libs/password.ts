import { argon2id, hash, verify } from 'argon2'

export class password {
  static async hash(password: string): Promise<string> {
    return await hash(password, {
      type: argon2id,
      timeCost: 3,
      memoryCost: 2 ** 16, // 64MB
      parallelism: 1
    })
  }

  static async verify(hash: string, plain: string): Promise<boolean> {
    return await verify(hash, plain)
  }
}
