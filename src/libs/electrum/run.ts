import { sha256 } from '@noble/hashes/sha2'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

import { ElectrsClient } from './index'

function toScriptHash(scriptPubKeyHex: string): string {
  const hash = sha256(hexToBytes(scriptPubKeyHex))
  return bytesToHex(hash.reverse())
}

async function main() {
  const electrs = new ElectrsClient('tcp', '127.0.0.1', 50001)
  await electrs.connect()

  const hash = toScriptHash('bc1q39svq5p2wcvxrpdfqntf94cfq3450uncpgfchy')
  const r = await electrs.blockchainScripthashListunspent('bc1q39svq5p2wcvxrpdfqntf94cfq3450uncpgfchy')
  console.log(r)

  electrs.close()
}

main().catch(console.error)
