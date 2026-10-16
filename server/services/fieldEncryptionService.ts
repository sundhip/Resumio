/**
 * Field-Level Encryption (FLE) Service
 * Phase 11: Production Hardening, Security, Privacy and Operations
 *
 * Encrypts sensitive candidate PII fields (phone numbers, home addresses, social URLs)
 * at rest in database columns using AES-256-GCM authenticated encryption.
 * Each ciphertext includes:
 * - 96-bit (12-byte) unique random Initialization Vector (IV)
 * - 128-bit (16-byte) GCM authentication tag for tamper resistance
 */

import crypto from 'crypto';

export interface EncryptedFieldPayload {
  iv: string; // Base64
  ciphertext: string; // Base64
  tag: string; // Base64
}

export class FieldEncryptionService {
  private masterKey: Buffer;

  constructor() {
    const rawKey = process.env.FIELD_ENCRYPTION_KEY || 'resumio_production_field_level_encryption_secret_2026_aes256';
    // Derive exactly 256 bits (32 bytes)
    this.masterKey = crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Derives a tenant-specific encryption key using PBKDF2
   */
  public deriveTenantKey(tenantId: string): Buffer {
    return crypto.pbkdf2Sync(this.masterKey, tenantId, 10000, 32, 'sha256');
  }

  /**
   * Encrypts plaintext string using AES-256-GCM
   * Serializes as compact string: enc:v1:<iv>:<tag>:<ciphertext>
   */
  public encrypt(plaintext: string, tenantId?: string): string {
    if (!plaintext) return '';
    const key = tenantId ? this.deriveTenantKey(tenantId) : this.masterKey;
    const iv = crypto.randomBytes(12); // 96 bits recommended for GCM

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const tag = cipher.getAuthTag().toString('base64');

    return `enc:v1:${iv.toString('base64')}:${tag}:${ciphertext}`;
  }

  /**
   * Decrypts AES-256-GCM formatted ciphertext
   */
  public decrypt(encoded: string, tenantId?: string): string {
    if (!encoded) return '';
    if (!encoded.startsWith('enc:v1:')) {
      return encoded; // Return as-is if unencrypted legacy data
    }

    const parts = encoded.split(':');
    if (parts.length !== 5) {
      throw new Error('Malformed encrypted field envelope.');
    }

    const iv = Buffer.from(parts[2], 'base64');
    const tag = Buffer.from(parts[3], 'base64');
    const ciphertext = parts[4];

    const key = tenantId ? this.deriveTenantKey(tenantId) : this.masterKey;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export const fieldEncryptionService = new FieldEncryptionService();
