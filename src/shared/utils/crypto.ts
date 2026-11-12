const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

export interface EncryptedData {
  iv: string;
  salt: string;
  ciphertext: string;
  tag: string;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string, password: string): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encodedData
  );

  const ciphertextArray = new Uint8Array(ciphertextBuffer);
  const ciphertext = ciphertextArray.slice(0, -TAG_LENGTH);
  const tag = ciphertextArray.slice(-TAG_LENGTH);

  return {
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    ciphertext: btoa(String.fromCharCode(...ciphertext)),
    tag: btoa(String.fromCharCode(...tag)),
  };
}

export async function decryptData(
  encrypted: EncryptedData,
  password: string
): Promise<string | null> {
  try {
    const iv = new Uint8Array(
      atob(encrypted.iv)
        .split('')
        .map(c => c.charCodeAt(0))
    );
    const salt = new Uint8Array(
      atob(encrypted.salt)
        .split('')
        .map(c => c.charCodeAt(0))
    );
    const ciphertext = new Uint8Array(
      atob(encrypted.ciphertext)
        .split('')
        .map(c => c.charCodeAt(0))
    );
    const tag = new Uint8Array(
      atob(encrypted.tag)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    const key = await deriveKey(password, salt);

    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      combined
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    return null;
  }
}

export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  // eslint-disable-next-line no-useless-escape
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
