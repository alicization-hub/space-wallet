import argon2 from 'argon2'
import { customAlphabet } from 'nanoid'
import qrcode from 'qrcode'
import speakeasy from 'speakeasy'

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // ไม่มี 1, I, O, 0
const nanoid = customAlphabet(alphabet, 6)

export function generate2FASecret(name: string) {
  const secret = speakeasy.generateSecret({
    name
  })

  return {
    base32: secret.base32, // ต้องเก็บไว้ใน DB
    otpauth_url: secret.otpauth_url // สำหรับสร้าง QR
  }
}

export async function generateQRCode(otpauth_url: string): Promise<string> {
  return await qrcode.toDataURL(otpauth_url)
}

export function verifyTOTP(token: string, base32: string): boolean {
  return speakeasy.totp.verify({
    secret: base32,
    encoding: 'base32',
    token,
    window: 1 // เผื่อเวลาเลื่อนได้ 1 ช่อง (30 วิ)
  })
}

export async function generateRecoveryCodes(count = 5) {
  const codes: { plain: string; hash: string }[] = []

  for (let i = 0; i < count; i++) {
    const code = nanoid()
    const hash = await argon2.hash(code)
    codes.push({ plain: code, hash })
  }

  return codes
}

// เมื่อ user ล็อกอินด้วย recovery code
export async function verifyRecoveryCode(
  inputCode: string,
  storedCodes: Wallet.RecoveryCode[]
): Promise<Wallet.RecoveryCode | null> {
  for (const stored of storedCodes) {
    if (stored.used) continue

    const isValid = await argon2.verify(stored.hash, inputCode)
    if (isValid) return stored
  }

  return null
}
