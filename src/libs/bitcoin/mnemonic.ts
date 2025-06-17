import { generateMnemonic, validateMnemonic } from '@scure/bip39'

import { wordlist } from '@/constants/wordlists/english'

export class mnemonic {
  static generate(wordCount: 12 | 24 = 24): string {
    const strength = wordCount === 24 ? 256 : 128
    return generateMnemonic(wordlist, strength)
  }

  static validate(mnemonic: string) {
    return validateMnemonic(mnemonic.trim().toLowerCase(), wordlist)
  }
}
