import { describe, it, expect } from 'vitest';
import {
  encryptData,
  decryptData,
  generateEncryptionKey,
  validatePasswordStrength,
  type EncryptedData,
} from '../crypto';

const PASSWORD = 'StrongPassword123!';
const PAYLOAD = JSON.stringify({
  address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  mnemonic: Array(24).fill('word'),
});

describe('crypto — encryptData/decryptData', () => {
  it('TC_CRYPTO_ROUNDTRIP_001 round-trips a UTF-8 payload', async () => {
    const encrypted = await encryptData(PAYLOAD, PASSWORD);
    const decrypted = await decryptData(encrypted, PASSWORD);
    expect(decrypted).toBe(PAYLOAD);
  });

  it('TC_CRYPTO_ROUNDTRIP_002 encrypts an empty string and returns it', async () => {
    const encrypted = await encryptData('', PASSWORD);
    expect(await decryptData(encrypted, PASSWORD)).toBe('');
  });

  it('TC_CRYPTO_ROUNDTRIP_003 produces base64 fields of the expected shape', async () => {
    const encrypted = await encryptData(PAYLOAD, PASSWORD);
    const b64 = /^[A-Za-z0-9+/]+={0,2}$/;
    expect(encrypted.iv).toMatch(b64);
    expect(encrypted.salt).toMatch(b64);
    expect(encrypted.ciphertext).toMatch(b64);
    expect(encrypted.tag).toMatch(b64);
    expect(encrypted.iv.length).toBe(16); // 12 bytes -> base64
    expect(encrypted.salt.length).toBe(24); // 16 bytes -> base64
    expect(encrypted.tag.length).toBe(24); // 16 bytes -> base64
  });

  it('TC_CRYPTO_ROUNDTRIP_004 uses a fresh salt/iv per encryption', async () => {
    const a = await encryptData(PAYLOAD, PASSWORD);
    const b = await encryptData(PAYLOAD, PASSWORD);
    expect(a.iv).not.toBe(b.iv);
    expect(a.salt).not.toBe(b.salt);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('TC_CRYPTO_ROUNDTRIP_005 does not leak the plaintext in the ciphertext', async () => {
    const encrypted = await encryptData(PAYLOAD, PASSWORD);
    expect(encrypted.ciphertext).not.toContain('word');
  });
});

describe('crypto — decryptData error handling', () => {
  it('TC_CRYPTO_DECRYPT_001 returns null for a wrong password', async () => {
    const encrypted = await encryptData(PAYLOAD, PASSWORD);
    expect(await decryptData(encrypted, 'WrongPassword123!')).toBeNull();
  });

  it('TC_CRYPTO_DECRYPT_002 returns null for malformed base64 fields', async () => {
    const malformed: EncryptedData = {
      iv: '!!!not-base64!!!',
      salt: '@@@',
      ciphertext: '###',
      tag: '%%%',
    };
    expect(await decryptData(malformed, PASSWORD)).toBeNull();
  });

  it('TC_CRYPTO_DECRYPT_003 returns null for tampered ciphertext', async () => {
    const encrypted = await encryptData(PAYLOAD, PASSWORD);
    const tampered: EncryptedData = {
      ...encrypted,
      ciphertext: encrypted.ciphertext.slice(0, -2) + 'AA',
    };
    expect(await decryptData(tampered, PASSWORD)).toBeNull();
  });

  it('TC_CRYPTO_DECRYPT_004 returns null for a tampered tag', async () => {
    const encrypted = await encryptData(PAYLOAD, PASSWORD);
    const tampered: EncryptedData = {
      ...encrypted,
      tag: encrypted.tag.slice(0, -2) + 'AA',
    };
    expect(await decryptData(tampered, PASSWORD)).toBeNull();
  });
});

describe('crypto — generateEncryptionKey', () => {
  it('TC_CRYPTO_KEY_001 returns a base64 32-byte key', () => {
    const key = generateEncryptionKey();
    expect(key).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(Buffer.from(key, 'base64').length).toBe(32);
  });

  it('TC_CRYPTO_KEY_002 generates distinct keys', () => {
    expect(generateEncryptionKey()).not.toBe(generateEncryptionKey());
  });
});

describe('crypto — validatePasswordStrength', () => {
  it('TC_CRYPTO_PWD_001 accepts a strong password', () => {
    const result = validatePasswordStrength(PASSWORD);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('TC_CRYPTO_PWD_002 rejects a password shorter than 12 characters', () => {
    const result = validatePasswordStrength('Ab1!xyz');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 12 characters long');
  });

  it('TC_CRYPTO_PWD_003 requires an uppercase letter', () => {
    const result = validatePasswordStrength('lowercase123!');
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('TC_CRYPTO_PWD_004 requires a lowercase letter', () => {
    const result = validatePasswordStrength('UPPERCASE123!');
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('TC_CRYPTO_PWD_005 requires a digit', () => {
    const result = validatePasswordStrength('NoDigitsHere!');
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('TC_CRYPTO_PWD_006 requires a special character', () => {
    const result = validatePasswordStrength('NoSpecial123');
    expect(result.errors).toContain('Password must contain at least one special character');
  });

  it('TC_CRYPTO_PWD_007 reports every failing rule at once', () => {
    const result = validatePasswordStrength('abc');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});
