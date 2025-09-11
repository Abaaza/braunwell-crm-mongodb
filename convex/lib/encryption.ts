// Server-side encryption utilities for Convex
// This uses simpler encryption suitable for the Convex environment

export function encryptNumber(value: number): string {
  try {
    // For Convex, we'll use a simpler reversible encoding
    // This combines the value with a key prefix for basic obfuscation
    const key = process.env.ENCRYPTION_KEY || 'default-secure-key-2024'
    const salt = key.substring(0, 8)
    
    // Create an obfuscated value
    const obfuscated = (value * 7919 + 3571).toString(36) // Prime numbers for obfuscation
    const encoded = btoa(`${salt}:${obfuscated}`)
    
    return encoded
  } catch (error) {
    console.error('Encryption error:', error)
    // Fallback: return the value with a prefix
    return `ENC:${value}`
  }
}

export function decryptNumber(encryptedValue: string): number {
  try {
    // Handle legacy unencrypted values (numbers stored as strings)
    const numValue = parseFloat(encryptedValue)
    if (!isNaN(numValue) && !encryptedValue.includes(':')) {
      return numValue
    }
    
    // Handle fallback encrypted values
    if (encryptedValue.startsWith('ENC:')) {
      return parseFloat(encryptedValue.replace('ENC:', ''))
    }
    
    // Decrypt the obfuscated value
    const decoded = atob(encryptedValue)
    const [salt, obfuscated] = decoded.split(':')
    
    if (!obfuscated) {
      return 0
    }
    
    // Reverse the obfuscation
    const value = parseInt(obfuscated, 36)
    const original = (value - 3571) / 7919
    
    return Math.round(original * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error('Decryption error:', error)
    return 0
  }
}

// Helper to check if a value needs encryption
export function isEncrypted(value: any): boolean {
  if (typeof value === 'number') return false
  if (typeof value !== 'string') return true
  
  // Check if it's a plain number stored as string
  const numValue = parseFloat(value)
  if (!isNaN(numValue) && !value.includes(':')) {
    return false
  }
  
  return true
}