import crypto from 'crypto'

const algorithm = 'aes-256-cbc'
const ivLength = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  // Ensure key is 32 bytes for AES-256
  return crypto.createHash('sha256').update(key).digest()
}

export function encryptNumber(value: number): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(ivLength)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    
    const encrypted = Buffer.concat([
      cipher.update(value.toString(), 'utf8'),
      cipher.final()
    ])
    
    // Return iv:encrypted as base64
    return Buffer.concat([iv, encrypted]).toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    // Fallback: return a hashed version that can't be decrypted
    return `HASH:${crypto.createHash('sha256').update(value.toString()).digest('hex')}`
  }
}

export function decryptNumber(encryptedValue: string): number {
  try {
    // Handle fallback hashed values
    if (encryptedValue.startsWith('HASH:')) {
      // Return 0 for hashed values as they can't be decrypted
      return 0
    }
    
    const key = getEncryptionKey()
    const buffer = Buffer.from(encryptedValue, 'base64')
    
    const iv = buffer.slice(0, ivLength)
    const encrypted = buffer.slice(ivLength)
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])
    
    return parseFloat(decrypted.toString())
  } catch (error) {
    console.error('Decryption error:', error)
    // Return 0 as a safe fallback
    return 0
  }
}

// Function to check if a value is encrypted
export function isEncrypted(value: any): boolean {
  if (typeof value !== 'string') return false
  
  // Check if it's a hashed value
  if (value.startsWith('HASH:')) return true
  
  // Try to decode as base64 and check length
  try {
    const buffer = Buffer.from(value, 'base64')
    return buffer.length >= ivLength
  } catch {
    return false
  }
}