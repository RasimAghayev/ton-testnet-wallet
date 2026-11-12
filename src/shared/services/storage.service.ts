import { APP_CONFIG } from '@/shared/config/app';
import { decryptData, encryptData, type EncryptedData } from '@/shared/utils/crypto';

interface StoredWallet {
  address: string;
  publicKey: string;
  mnemonic: string[];
}

interface EncryptedWallet {
  version: number;
  encrypted: EncryptedData;
}

const WALLET_KEY = APP_CONFIG.storageKeys.wallet;
const ENCRYPTION_VERSION = 1;

function isEncrypted(data: unknown): data is EncryptedWallet {
  return (
    typeof data === 'object' &&
    data !== null &&
    'version' in data &&
    'encrypted' in data &&
    (data as Record<string, unknown>).version === ENCRYPTION_VERSION
  );
}

function isPlainWallet(data: unknown): data is StoredWallet {
  return (
    typeof data === 'object' &&
    data !== null &&
    'address' in data &&
    'publicKey' in data &&
    'mnemonic' in data
  );
}

export const storageService = {
  async saveWallet(wallet: StoredWallet, password?: string): Promise<void> {
    const data = JSON.stringify(wallet);

    if (password) {
      const encrypted = await encryptData(data, password);
      const encryptedWallet: EncryptedWallet = {
        version: ENCRYPTION_VERSION,
        encrypted,
      };
      localStorage.setItem(WALLET_KEY, JSON.stringify(encryptedWallet));
    } else {
      localStorage.setItem(WALLET_KEY, data);
    }
  },

  async loadWallet(password?: string): Promise<StoredWallet | null> {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);

      if (isEncrypted(parsed)) {
        if (!password) {
          throw new Error('Password required to decrypt wallet');
        }
        const decrypted = await decryptData(parsed.encrypted, password);
        if (!decrypted) return null;
        return JSON.parse(decrypted) as StoredWallet;
      }

      if (isPlainWallet(parsed)) {
        return parsed;
      }

      return null;
    } catch {
      return null;
    }
  },

  async loadWalletWithPasswordCheck(password: string): Promise<{
    wallet: StoredWallet | null;
    needsMigration: boolean;
  }> {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return { wallet: null, needsMigration: false };

    try {
      const parsed = JSON.parse(raw);

      if (isEncrypted(parsed)) {
        const decrypted = await decryptData(parsed.encrypted, password);
        if (!decrypted) return { wallet: null, needsMigration: false };
        return { wallet: JSON.parse(decrypted) as StoredWallet, needsMigration: false };
      }

      if (isPlainWallet(parsed)) {
        return { wallet: parsed, needsMigration: true };
      }

      return { wallet: null, needsMigration: false };
    } catch {
      return { wallet: null, needsMigration: false };
    }
  },

  clearWallet(): void {
    localStorage.removeItem(WALLET_KEY);
  },

  hasWallet(): boolean {
    return localStorage.getItem(WALLET_KEY) !== null;
  },

  isEncrypted(): boolean {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return isEncrypted(parsed);
    } catch {
      return false;
    }
  },

  async migrateToEncrypted(password: string): Promise<boolean> {
    const { wallet, needsMigration } = await this.loadWalletWithPasswordCheck(password);
    if (!wallet || !needsMigration) return false;
    await this.saveWallet(wallet, password);
    return true;
  },
};
