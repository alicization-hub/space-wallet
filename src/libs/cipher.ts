import crypto from 'crypto'

import { xchacha20poly1305 } from '@noble/ciphers/chacha.js'
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js'
import { argon2idAsync } from '@noble/hashes/argon2.js'
import { randomBytes } from '@noble/hashes/utils.js'

import { CIPHER } from '@/constants/env'

export class cipher {
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
   * const encryptedData = encrypt("your-password", "Hello, World!")
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
   * const plainText = decrypt("your-password", encryptedData)
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
    return bytesToUtf8(plaintextBytes)
  }

  /**
   * 🔐 Encrypts a plain text string using symmetric encryption.
   *
   * @param secretKey - The secret key used for encryption
   * @param plainText - The string to be encrypted
   * @returns A hexadecimal string containing both Salt, IV, AuthTag and encrypted data
   *
   * @example
   * ```typescript
   * const encryptedData = symmetricEncrypt("your-secret-key", "Hello, World!")
   * console.log(encryptedData) // Returns hex string like "a1b2c3d4e5f6..."
   * ```
   */
  static async symmetricEncrypt(secretKey: string, plainText: string) {
    const bufferKey = Buffer.from(secretKey, 'utf-8')

    const SALT = crypto.randomBytes(CIPHER.salt)
    const IV = crypto.randomBytes(CIPHER.iv)
    const KEY = crypto.scryptSync(bufferKey, SALT, 32)

    const cipher = crypto.createCipheriv(CIPHER.algorithm, KEY, IV)
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()

    const combine = Buffer.concat([SALT, IV, tag, encrypted])
    return combine.toString('hex')
  }

  /**
   * 🔓 Decrypts an encrypted string using AES encryption algorithm.
   *
   * @param secretKey - The secret key used for decryption
   * @param encrypted - The encrypted string in hexadecimal format containing both IV and encrypted data
   * @returns The decrypted string in UTF-8 format
   *
   * @example
   * ```typescript
   * const encryptedHex = "1a2b3c4d5e6f..."
   * const plainText = symmetricDecrypt("your-secret-key", encryptedHex)
   * console.log(plainText) // "Hello, World!"
   * ```
   */
  static async symmetricDecrypt(secretKey: string, encryptedHex: string) {
    const bufferKey = Buffer.from(secretKey, 'utf-8')
    const data = Buffer.from(encryptedHex, 'hex')

    const SALT = data.subarray(0, CIPHER.salt)
    const IV = data.subarray(CIPHER.salt, CIPHER.salt + CIPHER.iv)
    const TAG = data.subarray(CIPHER.salt + CIPHER.iv, CIPHER.salt + CIPHER.iv + 16)
    const ENCRYPTED = data.subarray(CIPHER.salt + CIPHER.iv + 16)

    const KEY = crypto.scryptSync(bufferKey, SALT, 32)
    const decipher = crypto.createDecipheriv(CIPHER.algorithm, KEY, IV).setAuthTag(TAG)

    const decrypted = Buffer.concat([decipher.update(ENCRYPTED), decipher.final()])
    return decrypted.toString('utf8')
  }
}
