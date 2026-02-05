import { addYears } from 'date-fns'

import { CIPHER } from '@/constants/env'
import { cipher } from '@/libs/cipher'

async function main() {
  const [walletId, accountId] = [process.env.PRIV_SUB!, process.env.PRIV_UID!]
  const expiredAt = addYears(new Date(), 1)

  const payload: AccessToken = `space:${walletId}:${accountId}:${expiredAt.getTime()}`
  const token = await cipher.symmetricEncrypt(CIPHER.secret, payload)
  console.log(`🔑 Access Token:`, token)

  const decrypted = await cipher.symmetricDecrypt(CIPHER.secret, token)
  const payloadDecrypted = (decrypted as AccessToken).split(':')

  console.log(`📝 Validated Access Token:`, {
    walletId: payloadDecrypted[1],
    accountId: payloadDecrypted[2],
    expiredAt: new Date(Number(payloadDecrypted[3]))
  })
}

main()
