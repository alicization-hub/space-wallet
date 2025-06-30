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
  .min(10, { message: 'Passphrase must be at least 10 characters long' })
  .max(32, { message: 'Passphrase must not exceed 64 characters' })
  .regex(/[0-9]/, { message: 'Passphrase must contain at least one number' })
  .regex(/[a-z]/, { message: 'Passphrase must contain at least one lowercase letter' })
  .regex(/[A-Z]/, { message: 'Passphrase must contain at least one uppercase letter' })
  .regex(/[!@#$%&\-_]/, 'Passphrase must contain at least one special character (!@#$%&-_)')
  .regex(
    /^[a-zA-Z0-9!@#$%&\-_]+$/,
    'Passphrase can only contain letters, numbers, and these special characters: !@#$%&-_'
  )
  .refine((value) => !/(.)\1\1/.test(value), {
    message: 'Passphrase cannot have 3 or more identical characters in sequence.'
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
    { message: 'Passphrase contains a common pattern or sequence.' }
  )
