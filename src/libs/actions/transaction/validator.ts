import { z } from 'zod'

import { queryValidator as query } from '@/libs/validator.zod'

export const paramValidator = z.object({ id: z.string().uuid() })
export const queryValidator = query

export type ParamValidator = z.infer<typeof paramValidator>
export type QueryValidator = z.infer<typeof queryValidator>
