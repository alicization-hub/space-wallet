import { xchacha20poly1305 } from "@noble/ciphers/chacha.js"
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from "@noble/ciphers/utils.js"
import { argon2idAsync } from "@noble/hashes/argon2.js"
import { randomBytes } from "@noble/hashes/utils.js"

import { CIPHER } from "@/constants/env"

export class Cipher {
  /**
   * 🔐 Encrypts data using XChaCha20-Poly1305 with memory-hard key derivation
   *
   * @param plainText - The data to encrypt (string)
   * @param password - The password to use for encryption
   * @param security - The security level (number). optional
   * @returns Hex-encoded string containing salt, nonce, and ciphertext
   *
   * @example
   * ```typescript
   * const encryptedData = encrypt("Hello, World!", "your-password")
   * console.log(encryptedData) // Returns hex string like "a1b2c3d4e5f6..."
   * ```
   */
  static async encrypt(plainText: string, password: string, security?: number) {
    // Generate random salt and nonce
    const salt = randomBytes(CIPHER.salt)
    const nonce = randomBytes(CIPHER.nonce)

    // Derive key from password using Argon2id (memory-hard)
    const toBytes = utf8ToBytes(password)
    const key = await argon2idAsync(toBytes, salt, {
      t: CIPHER.argon2.iterations,
      m: security || CIPHER.security,
      p: CIPHER.argon2.parallelism,
      dkLen: CIPHER.key
    })

    // Convert plaintext to bytes
    const plainTextBytes = utf8ToBytes(plainText)

    // Encrypt using XChaCha20-Poly1305
    const ciphertext = xchacha20poly1305(key, nonce).encrypt(plainTextBytes)

    // Combine salt, nonce, and ciphertext into a single buffer
    const result = new Uint8Array(salt.length + nonce.length + ciphertext.length)
    result.set(salt, 0)
    result.set(nonce, salt.length)
    result.set(ciphertext, salt.length + nonce.length)

    // Clear sensitive data
    toBytes.fill(0)
    key.fill(0)
    plainTextBytes.fill(0)

    // Return as hex string
    return bytesToHex(result)
  }

  /**
   * 🔓 Decrypts data using XChaCha20-Poly1305 with memory-hard key derivation
   *
   * @param encryptedData - Hex-encoded string containing salt, nonce, and ciphertext
   * @param password - The password used for encryption
   * @param security - The security level (number). optional
   * @returns Decrypted plaintext string
   *
   * @example
   * ```typescript
   * const encryptedData = encrypt("your-password", "Hello, World!")
   * const plainText = decrypt(encryptedData, "your-password")
   * console.log(plainText) // "Hello, World!"
   * ```
   */
  static async decrypt(encryptedData: string, password: string, security?: number) {
    // Convert hex string to bytes
    const encryptedBytes = hexToBytes(encryptedData)

    // Extract salt, nonce, and ciphertext
    const salt = encryptedBytes.slice(0, CIPHER.salt)
    const nonce = encryptedBytes.slice(CIPHER.salt, CIPHER.salt + CIPHER.nonce)
    const ciphertext = encryptedBytes.slice(CIPHER.salt + CIPHER.nonce)

    // Derive key from password using Argon2id (memory-hard)
    const toBytes = utf8ToBytes(password)
    const key = await argon2idAsync(toBytes, salt, {
      t: CIPHER.argon2.iterations,
      m: security || CIPHER.security,
      p: CIPHER.argon2.parallelism,
      dkLen: CIPHER.key
    })

    // Decrypt using XChaCha20-Poly1305
    const plaintextBytes = xchacha20poly1305(key, nonce).decrypt(ciphertext)

    // Clear sensitive data
    toBytes.fill(0)
    key.fill(0)

    // Convert bytes to string
    const plainText = bytesToUtf8(plaintextBytes)
    plaintextBytes.fill(0)

    return plainText
  }
}
