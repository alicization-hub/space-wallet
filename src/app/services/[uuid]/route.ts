import { NextRequest } from 'next/server'

import { getRPC } from '@/libs/actions/rpc'
import { currentAccount } from '@/libs/actions/wallet'
import { ApiResponse } from '@/libs/resp'
import { paramValidator } from '@/libs/validator.zod'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: NextParams<{ uuid: UUID }>) {
  try {
    await paramValidator.parseAsync(await params)
    const id = req.nextUrl.searchParams.get('id')

    switch (id) {
      case '0':
        return ApiResponse.json(await getRPC())

      case '1':
        return ApiResponse.json(await currentAccount())

      default:
        return ApiResponse.catch('An error occurred: invalid ID.')
    }
  } catch (error) {
    return ApiResponse.catch(error)
  }
}
