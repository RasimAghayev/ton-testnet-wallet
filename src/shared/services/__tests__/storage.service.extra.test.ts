import { describe, it, expect, beforeEach, vi } from 'vitest';

const makeLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
  };
};
vi.stubGlobal('localStorage', makeLocalStorage());

import { storageService } from '../storage.service';
import { encryptData } from '@/shared/utils/crypto';

const WALLET_KEY = 'ton_wallet_v1';
const PASSWORD = 'StrongPassword123!'; // i-dont-think-this-is-a-secret
const WALLET = {
  address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  publicKey: 'abc123publickey',
  mnemonic: Array(24).fill('word') as string[],
};

async function seedEncrypted(password = PASSWORD) {
  const encrypted = await encryptData(JSON.stringify(WALLET), password);
  localStorage.setItem(WALLET_KEY, JSON.stringify({ version: 1, encrypted }));
}

beforeEach(() => {
  localStorage.clear();
});

describe('storageService.loadWalletWithPasswordCheck', () => {
  it('TC_STORAGE_CHECK_001 reports no wallet when storage is empty', async () => {
    await expect(storageService.loadWalletWithPasswordCheck(PASSWORD)).resolves.toEqual({
      wallet: null,
      needsMigration: false,
    });
  });

  it('TC_STORAGE_CHECK_002 flags a plain wallet as needing migration', async () => {
    localStorage.setItem(WALLET_KEY, JSON.stringify(WALLET));

    const result = await storageService.loadWalletWithPasswordCheck(PASSWORD);

    expect(result.wallet).toEqual(WALLET);
    expect(result.needsMigration).toBe(true);
  });

  it('TC_STORAGE_CHECK_003 decrypts an encrypted wallet with the right password', async () => {
    await seedEncrypted();

    const result = await storageService.loadWalletWithPasswordCheck(PASSWORD);

    expect(result.wallet).toEqual(WALLET);
    expect(result.needsMigration).toBe(false);
  });

  it('TC_STORAGE_CHECK_004 returns no wallet for a wrong password', async () => {
    await seedEncrypted();

    const result = await storageService.loadWalletWithPasswordCheck('WrongPassword123!');

    expect(result.wallet).toBeNull();
    expect(result.needsMigration).toBe(false);
  });

  it('TC_STORAGE_CHECK_005 returns no wallet for malformed JSON', async () => {
    localStorage.setItem(WALLET_KEY, '{not json');

    await expect(storageService.loadWalletWithPasswordCheck(PASSWORD)).resolves.toEqual({
      wallet: null,
      needsMigration: false,
    });
  });
});

describe('storageService.isEncrypted', () => {
  it('TC_STORAGE_ISENC_001 returns false when empty', () => {
    expect(storageService.isEncrypted()).toBe(false);
  });

  it('TC_STORAGE_ISENC_002 returns false for a plain wallet', () => {
    localStorage.setItem(WALLET_KEY, JSON.stringify(WALLET));
    expect(storageService.isEncrypted()).toBe(false);
  });

  it('TC_STORAGE_ISENC_003 returns true for an encrypted wallet', async () => {
    await seedEncrypted();
    expect(storageService.isEncrypted()).toBe(true);
  });

  it('TC_STORAGE_ISENC_004 returns false for malformed JSON', () => {
    localStorage.setItem(WALLET_KEY, 'not json at all');
    expect(storageService.isEncrypted()).toBe(false);
  });
});

describe('storageService.migrateToEncrypted', () => {
  it('TC_STORAGE_MIGRATE_001 encrypts a plain wallet and reports success', async () => {
    localStorage.setItem(WALLET_KEY, JSON.stringify(WALLET));

    const migrated = await storageService.migrateToEncrypted(PASSWORD);

    expect(migrated).toBe(true);
    expect(storageService.isEncrypted()).toBe(true);
    await expect(storageService.loadWallet(PASSWORD)).resolves.toEqual(WALLET);
  });

  it('TC_STORAGE_MIGRATE_002 returns false when there is no wallet', async () => {
    await expect(storageService.migrateToEncrypted(PASSWORD)).resolves.toBe(false);
  });

  it('TC_STORAGE_MIGRATE_003 returns false when the wallet is already encrypted', async () => {
    await seedEncrypted();
    await expect(storageService.migrateToEncrypted(PASSWORD)).resolves.toBe(false);
  });
});
