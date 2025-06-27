import { z } from 'zod'

import { passphraseSchema } from '@/libs/validator.zod'

export const importValidator = z.object({
  passphrase: passphraseSchema
})

export type ImportValidator = z.infer<typeof importValidator>
