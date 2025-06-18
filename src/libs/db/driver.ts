import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import { formatISO } from 'date-fns'

import { DATABASE } from '@/constants/env'

import { ciphers } from '../ciphers'

type TValues<V> = Omit<V, 'id' | 'createdAt' | 'updatedAt'>

export class Driver<T = Record<string, any>> {
  protected pathName: string

  constructor(table: Schema.Table, defaultContent?: string) {
    this.pathName = join(DATABASE.dir, table)

    if (!existsSync(this.pathName)) {
      this.createFile(defaultContent)
    }
  }

  private createFile(defaultContent: string = '[]'): void {
    mkdirSync(DATABASE.dir, { recursive: true })
    writeFileSync(this.pathName, defaultContent)
  }

  private async read(): Promise<T[]> {
    const content = readFileSync(this.pathName, 'utf-8')
    const contentDecrypted = await ciphers.decrypt(
      content.replace(/\n/g, ''),
      DATABASE.passkey,
      DATABASE.security
    )

    return JSON.parse(contentDecrypted)
  }

  private async write(content: T[]): Promise<void> {
    const toString = JSON.stringify(content)
    const contentEncrypted = await ciphers.encrypt(toString, DATABASE.passkey, DATABASE.security)
    writeFileSync(this.pathName, contentEncrypted, 'utf-8')
  }

  public async findAll(): Promise<T[]> {
    return this.read()
  }

  public async findOne(id: UUID): Promise<T | void> {
    const results = await this.findAll()
    return results.find((r: any) => r.id === id)
  }

  public async create(value: TValues<T>): Promise<T> {
    const results = await this.findAll()
    const id = randomUUID()

    const content: Record<string, any> = {
      id,
      ...value,
      createdAt: formatISO(new Date()),
      updatedAt: null
    }
    results.push(content as T)

    await this.write(results)
    return content as T
  }

  public async update(id: UUID, value: Partial<TValues<T>>): Promise<T | void> {
    const results = await this.findAll()
    const content = results.map((r: any) => {
      if (r.id === id) {
        return {
          ...r,
          ...value,
          updatedAt: formatISO(new Date())
        }
      }

      return r
    })

    await this.write(content)
    return content.find((r) => r.id === id) as T
  }

  public async delete(id: UUID): Promise<void> {
    const results = await this.findAll()
    const content = results.filter((r: any) => r.id !== id)
    await this.write(content)
  }
}
