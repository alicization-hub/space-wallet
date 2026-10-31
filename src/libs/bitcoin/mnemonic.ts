import { generateMnemonic, validateMnemonic } from "@scure/bip39"

import { WORDLIST } from "@/constants/wordlists/english"

export class Mnemonic {
  static generate(wordCount: MnemonicLength = 24): string {
    const strength = wordCount === 24 ? 256 : 128
    return generateMnemonic(WORDLIST, strength)
  }

  static validate(mnemonic: string) {
    return validateMnemonic(mnemonic.trim().toLowerCase(), WORDLIST)
  }
}
