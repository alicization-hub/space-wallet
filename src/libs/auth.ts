import { password } from './password'
import { verifyTOTP } from './twofa'

type User = {
  email: string
  passwordHash: string
  twoFASecret: string
}

export async function login(user: User, passwordPlain: string, token: string): Promise<boolean> {
  const validPassword = await password.verify(user.passwordHash, passwordPlain)
  if (!validPassword) return false

  const valid2FA = verifyTOTP(token, user.twoFASecret)
  if (!valid2FA) return false

  return true
}
