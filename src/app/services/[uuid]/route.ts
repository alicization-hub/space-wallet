import { NextRequest } from 'next/server'

import { findAccount } from '@/libs/actions/account'
import { syncAccountBalance } from '@/libs/actions/account/balance'
import { getRPC } from '@/libs/actions/rpc'
import { ApiResponse } from '@/libs/resp'
import { paramValidator } from '@/libs/validator.zod'

export async function POST(req: NextRequest, { params }: NextParams<{ uuid: string }>) {
  try {
    const { uuid } = paramValidator.parse(await params)
    const id = req.nextUrl.searchParams.get('id')

    switch (id) {
      case '0':
        return ApiResponse.json(await getRPC())

      case '1':
        await syncAccountBalance(uuid)
        return ApiResponse.json(await findAccount(uuid))

      default:
        return ApiResponse.catch('An error occurred: invalid ID.')
    }
  } catch (error) {
    return ApiResponse.catch(error)
  }
}
