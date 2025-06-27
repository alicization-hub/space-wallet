import { HDKey } from '@scure/bip32'
import { mnemonicToSeed, validateMnemonic } from '@scure/bip39'
import { getAddress, NETWORK } from '@scure/btc-signer'

import { wordlist } from '@/constants/wordlists/english'

import { derivationPathBuilder } from './derivation'

/**
 * The amount of satoshis in one BTC.
 */
export const COIN = 100_000_000

/**
 * The maximum number of consecutive unused addresses to generate.
 * `range(0, GAP_LIMIT)`
 */
export const GAP_LIMIT = 23

/**
 * Creates a root key from a mnemonic phrase for the Bitcoin main chain.
 *
 * @param mnemonic - The BIP-39 mnemonic phrase (12 or 24 words).
 * @param passphrase - string that will additionally protect the key.
 */
export async function createRootKey(mnemonic: string, passphrase?: string) {
  // Validate and normalize mnemonic
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid mnemonic phrase')
  }

  // Convert mnemonic to seed
  const seed = await mnemonicToSeed(mnemonic, passphrase)

  // Create master key from seed
  return HDKey.fromMasterSeed(seed)
}

/**
 * Generates a Bitcoin address from a root key.
 *
 * @param rootKey - The root key to derive the address from.
 */
export class AddressBuilder {
  protected rootKey: HDKey

  constructor(rootKey: HDKey) {
    this.rootKey = rootKey
  }

  /**
   * Creates a private key from a derivation path.
   *
   * @param derivationPath - The derivation path to derive the private key from.
   */
  private createPrivateKey(derivationPath: string) {
    // Derive the private key using the specified derivation path
    const { privateKey } = this.rootKey.derive(derivationPath)

    // Ensure private key exists
    if (!privateKey) {
      throw new Error('Failed to derive private key.')
    }

    return privateKey
  }

  /**
   * Generate a address.
   *
   * P2PKH (Pay-to-Public-Key-Hash).
   * P2WPKH (Pay-to-Witness-Public-Key-Hash).
   * P2TR (Pay-to-Taproot) address.
   *
   * @param purpose - The purpose of the address.
   * @param accountNo - The account index.
   * @param addressIndex - The address index.
   * @param isChange - The change boolean.
   */
  public create(purpose: 44 | 84 | 86, accountNo: number, addressIndex: number, isChange?: boolean) {
    const derivationPath = derivationPathBuilder()
      .purpose(purpose)
      .coinType(0)
      .account(accountNo)
      .change(isChange ? 1 : 0)
      .address(addressIndex)
      .build()
    const privateKey = this.createPrivateKey(derivationPath)
    const type: 'pkh' | 'wpkh' | 'tr' = {
      44: 'pkh',
      84: 'wpkh',
      86: 'tr'
    }[purpose] as any

    return getAddress(type, privateKey, NETWORK)!
  }

  /**
   * Generate a P2PKH (Pay-to-Public-Key-Hash).
   *
   * @param accountNo - The account index.
   * @param addressIndex - The address index.
   * @param isChange - The change boolean.
   * @returns P2PKH legacy address.
   */
  public legacy(accountNo: number, addressIndex: number, isChange?: boolean) {
    return this.create(44, accountNo, addressIndex, isChange)
  }

  /**
   * Generate a P2WPKH (Pay-to-Witness-Public-Key-Hash).
   *
   * @param accountNo - The account index.
   * @param addressIndex - The address index.
   * @param isChange - The change boolean.
   * @returns P2WPKH SegWit address.
   */
  public segWit(accountNo: number, addressIndex: number, isChange?: boolean) {
    return this.create(84, accountNo, addressIndex, isChange)
  }

  /**
   * Generate a P2TR (Pay-to-Taproot).
   *
   * @param accountNo - The account index.
   * @param addressIndex - The address index.
   * @param isChange - The change boolean.
   * @returns P2TR Taproot address.
   */
  public taproot(accountNo: number, addressIndex: number, isChange?: boolean) {
    return this.create(86, accountNo, addressIndex, isChange)
  }
}
