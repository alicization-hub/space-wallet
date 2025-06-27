import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils'
import { argon2idAsync } from '@noble/hashes/argon2'
import { bytesToUtf8, randomBytes, utf8ToBytes } from '@noble/hashes/utils'

import { CIPHERS } from '@/constants/env'

export class ciphers {
  /**
   * Encrypts data using XChaCha20-Poly1305 with memory-hard key derivation
   *
   * @param plaintext - The data to encrypt (string)
   * @param password - The password to use for encryption
   * @param security - The security level (number). optional
   * @returns Hex-encoded string containing salt, nonce, and ciphertext
   */
  static async encrypt(plaintext: string, password: string, security?: number) {
    // Generate random salt and nonce
    const salt = randomBytes(CIPHERS.salt)
    const nonce = randomBytes(CIPHERS.nonce)

    // Derive key from password using Argon2id (memory-hard)
    const toBytes = utf8ToBytes(password)
    const key = await argon2idAsync(toBytes, salt, {
      t: CIPHERS.argon2.iterations,
      m: security || CIPHERS.security,
      p: CIPHERS.argon2.parallelism,
      dkLen: CIPHERS.key
    })

    // Convert plaintext to bytes
    const plaintextBytes = utf8ToBytes(plaintext)

    // Encrypt using XChaCha20-Poly1305
    const ciphertext = xchacha20poly1305(key, nonce).encrypt(plaintextBytes)

    // Combine salt, nonce, and ciphertext into a single buffer
    const result = new Uint8Array(salt.length + nonce.length + ciphertext.length)
    result.set(salt, 0)
    result.set(nonce, salt.length)
    result.set(ciphertext, salt.length + nonce.length)

    // Clear sensitive data
    toBytes.fill(0)
    key.fill(0)

    // Return as hex string
    return bytesToHex(result)
  }

  /**
   * Decrypts data using XChaCha20-Poly1305 with memory-hard key derivation
   *
   * @param encryptedData - Hex-encoded string containing salt, nonce, and ciphertext
   * @param password - The password used for encryption
   * @param security - The security level (number). optional
   * @returns Decrypted plaintext string
   */
  static async decrypt(encryptedData: string, password: string, security?: number) {
    // Convert hex string to bytes
    const encryptedBytes = hexToBytes(encryptedData)

    // Extract salt, nonce, and ciphertext
    const salt = encryptedBytes.slice(0, CIPHERS.salt)
    const nonce = encryptedBytes.slice(CIPHERS.salt, CIPHERS.salt + CIPHERS.nonce)
    const ciphertext = encryptedBytes.slice(CIPHERS.salt + CIPHERS.nonce)

    // Derive key from password using Argon2id (memory-hard)
    const toBytes = utf8ToBytes(password)
    const key = await argon2idAsync(toBytes, salt, {
      t: CIPHERS.argon2.iterations,
      m: security || CIPHERS.security,
      p: CIPHERS.argon2.parallelism,
      dkLen: CIPHERS.key
    })

    // Decrypt using XChaCha20-Poly1305
    const plaintextBytes = xchacha20poly1305(key, nonce).decrypt(ciphertext)

    // Clear sensitive data
    toBytes.fill(0)
    key.fill(0)

    // Convert bytes to string
    return bytesToUtf8(plaintextBytes)
  }
}
