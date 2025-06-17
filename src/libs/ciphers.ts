import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils'
import { argon2idAsync } from '@noble/hashes/argon2'
import { bytesToUtf8, randomBytes, utf8ToBytes } from '@noble/hashes/utils'

const SALT_LENGTH = 16 // 16 bytes salt
const NONCE_LENGTH = 24 // 24 bytes nonce for XChaCha20
const KEY_LENGTH = 32 // 32 bytes key for XChaCha20
const SECURITY_LEVEL = 2 ** 20 // requires 1GB of RAM to calculate
const ARGON2_ITERATIONS = 2
const ARGON2_PARALLELISM = 1

export class ciphers {
  /**
   * Encrypts data using XChaCha20-Poly1305 with memory-hard key derivation
   *
   * @param plaintext - The data to encrypt (string)
   * @param password - The password to use for encryption
   * @returns Hex-encoded string containing salt, nonce, and ciphertext
   */
  static async encrypt(plaintext: string, passwordHash: string) {
    // Generate random salt and nonce
    const salt = randomBytes(SALT_LENGTH)
    const nonce = randomBytes(NONCE_LENGTH)

    // Derive key from password using Argon2id (memory-hard)
    const toBytes = utf8ToBytes(passwordHash)
    const key = await argon2idAsync(toBytes, salt, {
      t: ARGON2_ITERATIONS,
      m: SECURITY_LEVEL,
      p: ARGON2_PARALLELISM,
      dkLen: KEY_LENGTH
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

    // Return as hex string
    return bytesToHex(result)
  }

  /**
   * Decrypts data using XChaCha20-Poly1305 with memory-hard key derivation
   *
   * @param encryptedData - Hex-encoded string containing salt, nonce, and ciphertext
   * @param password - The password used for encryption
   * @returns Decrypted plaintext string
   */
  static async decrypt(encryptedData: string, passwordHash: string) {
    // Convert hex string to bytes
    const encryptedBytes = hexToBytes(encryptedData)

    // Extract salt, nonce, and ciphertext
    const salt = encryptedBytes.slice(0, SALT_LENGTH)
    const nonce = encryptedBytes.slice(SALT_LENGTH, SALT_LENGTH + NONCE_LENGTH)
    const ciphertext = encryptedBytes.slice(SALT_LENGTH + NONCE_LENGTH)

    // Derive key from password using Argon2id (memory-hard)
    const toBytes = utf8ToBytes(passwordHash)
    const key = await argon2idAsync(toBytes, salt, {
      t: ARGON2_ITERATIONS,
      m: SECURITY_LEVEL,
      p: ARGON2_PARALLELISM,
      dkLen: KEY_LENGTH
    })

    // Decrypt using XChaCha20-Poly1305
    const plaintextBytes = xchacha20poly1305(key, nonce).decrypt(ciphertext)

    // Convert bytes to string
    return bytesToUtf8(plaintextBytes)
  }
}
