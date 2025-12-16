import { NextRequest } from 'next/server'

import { useAuth } from '@/libs/actions/auth'
import { getRPC } from '@/libs/actions/rpc'
import { currentAccount } from '@/libs/actions/wallet'
import { RPCClient } from '@/libs/bitcoin/rpc'
import { ApiResponse } from '@/libs/resp'
import { paramValidator } from '@/libs/validator.zod'

export async function GET(req: NextRequest, { params }: NextParams<{ uuid: string }>) {
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

export async function POST(req: NextRequest, { params }: NextParams<{ uuid: string }>) {
  try {
    await paramValidator.parseAsync(await params)
    const auth = await useAuth()

    const rpcClient = new RPCClient()
    await rpcClient.setWallet(auth.account.id)

    // await syncAccount(auth.uid, rpcClient)
    // await syncTransactions(auth.uid, rpcClient)
    // await syncAddresses(auth.uid)

    return ApiResponse.message('✅ The tasks have been successfully synced.')
  } catch (error) {
    return ApiResponse.catch(error)
  }
}
