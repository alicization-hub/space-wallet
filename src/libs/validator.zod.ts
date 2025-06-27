import { z } from 'zod'

export const paramValidator = z.object({ uuid: z.string().uuid() })

export const queryValidator = z.object({
  page: z.string().default('1').transform(Number),
  take: z.string().default('10').transform(Number),
  status: z.enum(['all', 'active', 'inactive']).optional(),
  search: z.string().optional()
})

export const passphraseSchema = z
  .string()
  .min(8, { message: 'Passphrase must be at least 8 characters long.' })
  .max(32, { message: 'Passphrase must be at most 32 characters long.' })
  .regex(/[A-Z]/, { message: 'Passphrase must contain at least one uppercase letter.' })
  .regex(/[a-z]/, { message: 'Passphrase must contain at least one lowercase letter.' })
  .regex(/[0-9]/, { message: 'Passphrase must contain at least one number.' })
  .regex(/[^A-Za-z0-9]/, { message: 'Passphrase must contain at least one special character.' })
  .refine(
    (value) => {
      // Check for no more than 2 identical characters in a row
      return !/(.)\1\1/.test(value)
    },
    { message: 'Passphrase cannot have 3 or more identical characters in sequence.' }
  )
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
    { message: 'Passphrase contains a common pattern or sequence.' }
  )
