import { z } from "zod"

import { queryValidator as query } from "@/libs/validator.zod"

export const queryValidator = query.omit({ status: true, search: true }).extend({
  status: z.enum(["all", "used", "unused"]).optional(),
  type: z.enum(["all", "change", "receive"]).optional()
})

export type QueryValidator = z.infer<typeof queryValidator>
