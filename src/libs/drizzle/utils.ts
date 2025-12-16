import { timestamp, type PgSelect } from 'drizzle-orm/pg-core'

export const sharedTimestampConumns = {
  createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true }).$onUpdate(() => new Date())
}

export function withPagination<T extends PgSelect>(qb: T, page: number = 1, pageSize: number = 10) {
  return qb.limit(pageSize).offset((page - 1) * pageSize)
}
