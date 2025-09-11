# Data Encryption at Rest Implementation

This document describes the implementation of data encryption at rest for sensitive data in the CRM application.

## Overview

The encryption system provides client-side encryption for sensitive data before storing it in the Convex database. It uses industry-standard AES-256-GCM encryption with proper key derivation and ensures backward compatibility with existing data.

## Features

- **AES-256-GCM Encryption**: Uses authenticated encryption with associated data (AEAD)
- **Key Derivation**: PBKDF2 with 100,000 iterations for secure key generation
- **Unique Salts**: Each encrypted value uses a unique salt for security
- **Backward Compatibility**: Seamlessly handles mixed encrypted/unencrypted data
- **Entity-Based Configuration**: Configurable encryption per entity type
- **Search Compatibility**: Maintains search functionality through indexed plaintext
- **Migration Tools**: Utilities for migrating existing data to encrypted format

## Architecture

### Core Components

1. **Encryption Utilities** (`convex/encryption.ts`)
   - Core encryption/decryption functions
   - Entity-specific encryption configuration
   - Sensitive data detection utilities

2. **Migration Tools** (`convex/migrations.ts`)
   - Batch migration utilities
   - Migration status tracking
   - Encryption validation tools

3. **Updated CRUD Operations**
   - Modified existing functions to handle encrypted data
   - Transparent encryption/decryption in queries and mutations

## Encryption Configuration

### Sensitive Fields by Entity

#### Contacts
- **Always Encrypted**: `email`, `phone`
- **Conditionally Encrypted**: `notes` (if contains sensitive data)

#### Users
- **Always Encrypted**: `email`

#### Project Payments
- **Always Encrypted**: `reference`, `notes`

#### Company Settings
- **Always Encrypted**: `email`, `phone`, `vatNumber`, `companyNumber`
- **Nested Fields**: `bankDetails.accountName`, `bankDetails.accountNumber`, `bankDetails.sortCode`

#### Invoices
- **Always Encrypted**: `notes`
- **Nested Fields**: `clientInfo.email`, `companyInfo.email`, `companyInfo.phone`

#### Audit Logs
- **Always Encrypted**: `ipAddress`
- **Conditionally Encrypted**: `changes` (if contains sensitive data)

## Usage Examples

### Basic Encryption/Decryption

```typescript
import { encryptValue, decryptValue, isEncrypted } from './convex/encryption'

// Encrypt a value
const encrypted = encryptValue('john@example.com')
console.log(encrypted) // "enc:base64_encrypted_data"

// Decrypt a value
const decrypted = decryptValue(encrypted)
console.log(decrypted) // "john@example.com"

// Check if value is encrypted
console.log(isEncrypted(encrypted)) // true
```

### Entity-Based Encryption

```typescript
import { encryptEntityData, decryptEntityData } from './convex/encryption'

// Encrypt contact data
const contactData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+44123456789',
  company: 'Test Company'
}

const encrypted = encryptEntityData(contactData, 'contacts')
// Only email and phone are encrypted, name and company remain plaintext

const decrypted = decryptEntityData(encrypted, 'contacts')
// Returns original data with sensitive fields decrypted
```

### In CRUD Operations

```typescript
// In a mutation
export const createContact = mutation({
  handler: async (ctx, args) => {
    // Encrypt sensitive fields before storing
    const encryptedData = encryptEntityData(args, 'contacts')
    const contactId = await ctx.db.insert("contacts", encryptedData)
    return contactId
  }
})

// In a query
export const getContact = query({
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id)
    if (!contact) return null
    
    // Decrypt sensitive fields before returning
    return decryptEntityData(contact, 'contacts')
  }
})
```

## Security Features

### Key Management

- **Master Key**: Stored in environment variable `ENCRYPTION_MASTER_KEY`
- **Key Derivation**: PBKDF2 with unique salts per encryption
- **Key Rotation**: Support for key rotation through environment variable updates

### Encryption Strength

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Length**: 256 bits (32 bytes)
- **IV Length**: 128 bits (16 bytes)  
- **Salt Length**: 256 bits (32 bytes)
- **Iterations**: 100,000 PBKDF2 iterations

### Data Integrity

- **Authentication**: GCM mode provides built-in authentication
- **Tampering Detection**: Failed decryption indicates data tampering
- **Validation Tools**: Built-in encryption validation utilities

## Migration Process

### 1. Check Migration Status

```typescript
import { getMigrationStatus } from './convex/migrations'

const status = await getMigrationStatus()
console.log(status)
// Shows encryption status for all entities
```

### 2. Migrate Data

```typescript
import { migrateAllData } from './convex/migrations'

// Migrate all data types
const result = await migrateAllData({ userId: 'user_id' })

// Or migrate specific entity types
const contactsResult = await migrateContacts({ 
  batchSize: 100, 
  userId: 'user_id' 
})
```

### 3. Validate Encryption

```typescript
import { validateEncryption } from './convex/migrations'

const validation = await validateEncryption()
if (validation.status === 'issues_found') {
  console.log('Encryption issues:', validation.issues)
}
```

## Performance Considerations

### Query Performance

- **Search Indexes**: Maintain plaintext search indexes for performance
- **Batch Operations**: Process encryption/decryption in batches
- **Caching**: Consider caching decrypted values for frequently accessed data

### Storage Impact

- **Size Increase**: Encrypted data is approximately 2-3x larger than plaintext
- **Metadata**: Each encrypted value includes salt, IV, and authentication tag
- **Compression**: Consider enabling database compression for encrypted fields

## Best Practices

### Development

1. **Environment Variables**: Always set `ENCRYPTION_MASTER_KEY` in production
2. **Key Security**: Use secure key generation and storage practices
3. **Testing**: Use the provided test utilities to validate encryption
4. **Migration**: Test migrations on staging data before production

### Production

1. **Key Backup**: Securely backup encryption keys
2. **Monitoring**: Monitor encryption/decryption performance
3. **Audit**: Regularly validate encryption integrity
4. **Rotation**: Plan for periodic key rotation

## Testing

### Run Encryption Tests

```bash
npm test -- encryption.test.ts
```

### Test Encryption Functionality

```typescript
import { testEncryption } from './convex/migrations'

const testResult = await testEncryption({ testValue: 'test@example.com' })
console.log(testResult)
// Should return: { success: true, matches: true, ... }
```

## Troubleshooting

### Common Issues

1. **Decryption Failures**
   - Check `ENCRYPTION_MASTER_KEY` environment variable
   - Validate encrypted data integrity
   - Ensure proper key derivation

2. **Performance Issues**
   - Reduce batch sizes for large datasets
   - Consider asynchronous processing for migrations
   - Monitor memory usage during bulk operations

3. **Migration Problems**
   - Check migration status before running
   - Handle partial migrations gracefully
   - Validate data before and after migration

### Debug Tools

```typescript
// Test encryption/decryption
const test = await testEncryption({ testValue: 'test@example.com' })

// Validate all encrypted data
const validation = await validateEncryption()

// Check migration status
const status = await getMigrationStatus()
```

## API Reference

### Core Functions

- `encryptValue(plaintext: string): string`
- `decryptValue(encryptedValue: string): string`
- `isEncrypted(value: string): boolean`
- `encryptEntityData(data: object, entityType: string): object`
- `decryptEntityData(data: object, entityType: string): object`

### Migration Functions

- `migrateContacts(options): Promise<MigrationResult>`
- `migrateProjectPayments(options): Promise<MigrationResult>`
- `migrateCompanySettings(options): Promise<MigrationResult>`
- `migrateAllData(options): Promise<MigrationResults>`

### Validation Functions

- `getMigrationStatus(): Promise<MigrationStatus>`
- `validateEncryption(): Promise<ValidationResult>`
- `testEncryption(options): Promise<TestResult>`

## Environment Variables

```env
# Production encryption key (required)
ENCRYPTION_MASTER_KEY=your_secure_encryption_key_here

# Development fallback (insecure - for testing only)
# Uses fallback key if ENCRYPTION_MASTER_KEY not set
```

## Security Notes

- **Never commit encryption keys to version control**
- **Use secure key generation for production keys**
- **Implement proper key rotation procedures**
- **Monitor for failed decryption attempts**
- **Regularly audit encryption implementation**

This implementation provides a robust foundation for data encryption at rest while maintaining the application's functionality and performance characteristics.