import { bech32, bech32m } from '@scure/base'
import { z } from 'zod'

export const paramValidator = z.object({ uuid: z.uuid() })

export const queryValidator = z.object({
  page: z.string().default('1').transform(Number),
  take: z.string().default('10').transform(Number),
  status: z.enum(['all', 'active', 'inactive']).optional(),
  search: z.string().optional()
})

export const passphraseSchema = z
  .string()
  .min(10, { error: 'Passphrase must be at least 10 characters long' })
  .max(32, { error: 'Passphrase must not exceed 64 characters' })
  .regex(/[0-9]/, { error: 'Passphrase must contain at least one number' })
  .regex(/[a-z]/, { error: 'Passphrase must contain at least one lowercase letter' })
  .regex(/[A-Z]/, { error: 'Passphrase must contain at least one uppercase letter' })
  .regex(/[!@#$%&\-_]/, { error: 'Passphrase must contain at least one special character (!@#$%&-_)' })
  .regex(/^[a-zA-Z0-9!@#$%&\-_]+$/, {
    error: 'Passphrase can only contain letters, numbers, and these special characters: !@#$%&-_'
  })
  .refine((value) => !/(.)\1\1/.test(value), {
    error: 'Passphrase cannot have 3 or more identical characters in sequence.'
  })
  .refine(
    (value) => {
      // Check for common patterns (e.g., "123", "abc")
      const commonPatterns = [
        '123',
        '234',
        '345',
        '456',
        '567',
        '678',
        '789',
        '890',
        'abc',
        'bcd',
        'cde',
        'def',
        'efg',
        'fgh',
        'ghi',
        'hij',
        'ijk',
        'jkl',
        'klm',
        'lmn',
        'mno',
        'nop',
        'opq',
        'pqr',
        'qrs',
        'rst',
        'stu',
        'tuv',
        'uvw',
        'vwx',
        'wxy',
        'xyz',
        'qwerty',
        'asdfgh',
        'zxcvbn'
      ]

      return !commonPatterns.some((pattern) => value.toLowerCase().includes(pattern))
    },
    { error: 'Passphrase contains a common pattern or sequence.' }
  )

export const addressSchema = z
  .string()
  .nonempty({ error: 'This field "address" is required' })
  .refine(
    (address: any) => {
      try {
        if (address.startsWith('bc1q') || address.startsWith('tb1q')) {
          const decoded = bech32.decode(address)
          return decoded.prefix === 'bc' || decoded.prefix === 'tb'
        }

        if (address.startsWith('bc1p') || address.startsWith('tb1p')) {
          const decoded = bech32m.decode(address)
          return decoded.prefix === 'bc' || decoded.prefix === 'tb'
        }

        return false
      } catch {
        return false
      }
    },
    { error: 'Invalid Bitcoin address (only SegWit and Taproot supported).' }
  )

export const txidSchema = z
  .string()
  .nonempty({ error: 'This field "txid" is required' })
  .length(64)
  .regex(/^[0-9a-fA-F]{64}$/, { error: 'Invalid TXID: must be 64-character hex string.' })
