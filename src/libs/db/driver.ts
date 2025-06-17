import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import { formatISO } from 'date-fns'

import { DATABASE_DIR } from '@/constants/env'
import { nanoId } from '@/libs/utils'

type TValues<V> = Omit<V, 'id' | 'createdAt' | 'updatedAt'>

export class Driver<T = Record<string, any>> {
  protected pathName: string

  constructor(table: Schema.Table, defaultContent?: string) {
    this.pathName = join(DATABASE_DIR, `${table}.json`)

    if (!existsSync(this.pathName)) {
      this.createFile(defaultContent)
    }
  }

  private createFile(defaultContent: string = '[]'): void {
    mkdirSync(DATABASE_DIR, { recursive: true })
    writeFileSync(this.pathName, defaultContent)
  }

  private read(): T[] {
    const content = readFileSync(this.pathName, 'utf-8')
    return JSON.parse(content)
  }

  private write(content: T[]): void {
    writeFileSync(this.pathName, JSON.stringify(content), 'utf-8')
  }

  public async findAll(): Promise<T[]> {
    return this.read()
  }

  public async findOne(id: string): Promise<T | void> {
    const results = await this.findAll()
    return results.find((r: any) => r.id === id)
  }

  public async create(value: TValues<T>): Promise<T> {
    const results = await this.findAll()
    const id = nanoId(16)

    const content: Record<string, any> = {
      id,
      ...value,
      createdAt: formatISO(new Date()),
      updatedAt: null
    }
    results.push(content as T)

    this.write(results)
    return content as T
  }

  public async update(id: string, value: Partial<TValues<T>>): Promise<T | void> {
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

    this.write(content)
    return content.find((r) => r.id === id) as T
  }

  public async delete(id: string): Promise<void> {
    const results = await this.findAll()
    const content = results.filter((r: any) => r.id !== id)
    this.write(content)
  }
}
