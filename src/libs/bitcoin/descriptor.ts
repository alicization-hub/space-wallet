import { ripemd160 } from '@noble/hashes/legacy'
import { sha256 } from '@noble/hashes/sha2'
import { bytesToHex } from '@noble/hashes/utils'
import { HDKey } from '@scure/bip32'

/**
 * Creates a set of descriptors for a wallet account.
 *
 * @param rootKey - The HD root key to derive the descriptors from.
 * @param purpose - The purpose of the descriptors, either 84 for segwit or 86 for taproot. Defaults to `84`.
 * @param account - The account number to derive the descriptors for. Defaults to `0`.
 * @returns An object with 'receive' and 'change' properties containing the descriptors.
 */
export function createDescriptors(rootKey: HDKey, purpose: Purpose = 84, account: number = 0) {
  const path = `${purpose}'/0'/${account}'`
  const derived = rootKey.derive(`m/${path}`)
  if (!derived.publicKey) {
    throw new Error('Failed to derive public key.')
  }

  const xpub = derived.publicExtendedKey
  const pubHash = sha256(derived.publicKey)
  const h160 = ripemd160(pubHash)
  const fingerprint = bytesToHex(h160.slice(0, 4))

  const prefix = purpose === 84 ? 'wpkh' : 'tr'
  const desc = `${prefix}([${fingerprint}/${path}]${xpub}`

  return {
    receive: `${desc}/0/*)`,
    change: `${desc}/1/*)`
  }
}
