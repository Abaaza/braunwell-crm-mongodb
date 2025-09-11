// Simple encryption helpers that work without Node.js crypto
// For production, you would want to use a proper encryption service

/**
 * Checks if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith('enc:')
}

/**
 * Simple obfuscation using base64 encoding
 * NOTE: This is NOT secure encryption - just for development
 */
export function encryptValue(plaintext: string): string {
  if (!plaintext || plaintext.trim() === '') {
    return plaintext
  }
  
  // Simple base64 encoding with prefix
  try {
    const encoded = btoa(unescape(encodeURIComponent(plaintext)))
    return `enc:${encoded}`
  } catch (error) {
    console.error('Encoding failed:', error)
    return plaintext
  }
}

/**
 * Decodes a value that was encoded with encryptValue
 */
export function decryptValue(encryptedValue: string): string {
  if (!encryptedValue || !encryptedValue.startsWith('enc:')) {
    return encryptedValue
  }
  
  try {
    const encoded = encryptedValue.slice(4)
    return decodeURIComponent(escape(atob(encoded)))
  } catch (error) {
    console.error('Decoding failed:', error)
    return encryptedValue
  }
}

/**
 * Encrypts fields in an entity object based on the fieldMap
 */
export async function encryptEntityData<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: string[],
  encryptFn: (value: string) => string | Promise<string>
): Promise<T> {
  const result: any = { ...data }
  
  for (const field of fieldsToEncrypt) {
    if (field in result && result[field] && typeof result[field] === 'string') {
      const encrypted = encryptFn(result[field])
      result[field] = encrypted instanceof Promise ? await encrypted : encrypted
    }
  }
  
  return result as T
}

/**
 * Decrypts fields in an entity object
 */
export async function decryptEntityData<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: string[],
  decryptFn: (value: string) => string | Promise<string>
): Promise<T> {
  const result: any = { ...data }
  
  for (const field of fieldsToDecrypt) {
    if (field in result && result[field] && isEncrypted(result[field])) {
      const decrypted = decryptFn(result[field])
      result[field] = decrypted instanceof Promise ? await decrypted : decrypted
    }
  }
  
  return result as T
}

/**
 * Prepares data for migration to encrypted format
 */
export async function migrateToEncrypted<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: string[],
  encryptFn: (value: string) => string | Promise<string>
): Promise<T> {
  const result: any = { ...data }
  
  for (const field of fieldsToEncrypt) {
    if (field in result && result[field] && typeof result[field] === 'string' && !isEncrypted(result[field])) {
      const encrypted = encryptFn(result[field])
      result[field] = encrypted instanceof Promise ? await encrypted : encrypted
    }
  }
  
  return result as T
}