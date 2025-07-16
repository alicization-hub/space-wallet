type DerivationPathBuilder = {
  /**
   * Set the purpose of the derivation path.
   *
   * @param value - The value to set. Default to 84.
   */
  purpose: (value: Purpose) => Omit<DerivationPathBuilder, 'purpose'>

  /**
   * Set the coin type of the derivation path.
   *
   * @param value - The value to set. Default to 0.
   */
  coinType: (value: number) => Omit<DerivationPathBuilder, 'coinType'>

  /**
   * Set the account of the derivation path.
   *
   * @param value - The value to set. Default to 0.
   */
  account: (value: number) => Omit<DerivationPathBuilder, 'account'>

  /**
   * Set the change of the derivation path.
   *
   * @param value - The value to set. Must be 0 or 1. Default to 0.
   */
  change: (value: 0 | 1) => Omit<DerivationPathBuilder, 'change'>

  /**
   * Set the address of the derivation path.
   *
   * @param index - The address index to set. Default to 0.
   */
  address: (index: number) => Omit<DerivationPathBuilder, 'address'>

  /**
   * Build the derivation path.
   *
   * @returns The derivation path as a string.
   * @defaults `m/84'/0'/0'/0/0`
   */
  build: () => string
}

/**
 * A builder for creating a derivation path.
 */
export function derivationPathBuilder(): DerivationPathBuilder {
  const parts: number[] = [84, 0, 0, 0, 0]
  const builder: DerivationPathBuilder = {
    purpose(value: Purpose) {
      parts[0] = value
      return this
    },
    coinType(value: number) {
      parts[1] = value
      return this
    },
    account(value: number) {
      parts[2] = value
      return this
    },
    change(value: 0 | 1) {
      parts[3] = value
      return this
    },
    address(index: number) {
      parts[4] = index
      return this
    },
    build() {
      if (parts.length !== 5) {
        throw new Error('Incomplete derivation path.')
      }

      return `m/${parts[0]}'/${parts[1]}'/${parts[2]}'/${parts[3]}/${parts[4]}`
    }
  }

  return builder
}
