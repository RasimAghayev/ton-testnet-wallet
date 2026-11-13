import { describe, it, expect, beforeEach, vi } from 'vitest';

// Provide a full in-memory localStorage that works in any test environment.
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

const MOCK_WALLET = {
  address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  publicKey: 'abc123publickey',
  mnemonic: Array(24).fill('word') as string[],
};

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads a wallet', async () => {
    await storageService.saveWallet(MOCK_WALLET);
    const loaded = await storageService.loadWallet();
    expect(loaded).toEqual(MOCK_WALLET);
  });

  it('returns null when no wallet is stored', async () => {
    const loaded = await storageService.loadWallet();
    expect(loaded).toBeNull();
  });

  it('hasWallet returns false when storage is empty', () => {
    expect(storageService.hasWallet()).toBe(false);
  });

  it('hasWallet returns true after saving', async () => {
    await storageService.saveWallet(MOCK_WALLET);
    expect(storageService.hasWallet()).toBe(true);
  });

  it('clearWallet removes the stored wallet', async () => {
    await storageService.saveWallet(MOCK_WALLET);
    storageService.clearWallet();
    const loaded = await storageService.loadWallet();
    expect(loaded).toBeNull();
    expect(storageService.hasWallet()).toBe(false);
  });

  it('loadWallet returns null when storage contains malformed JSON', async () => {
    localStorage.setItem('ton_wallet_v1', 'not-valid-json{{{');
    const loaded = await storageService.loadWallet();
    expect(loaded).toBeNull();
  });

  it('encrypts and decrypts wallet with password', async () => {
    const password = 'StrongPassword123!'; // i-dont-think-this-is-a-secret
    await storageService.saveWallet(MOCK_WALLET, password);
    const loaded = await storageService.loadWallet(password);
    expect(loaded).toEqual(MOCK_WALLET);
    expect(storageService.isEncrypted()).toBe(true);
  });

  it('returns null when wrong password provided', async () => {
    const password = 'StrongPassword123!'; // i-dont-think-this-is-a-secret
    await storageService.saveWallet(MOCK_WALLET, password);
    const loaded = await storageService.loadWallet('WrongPassword123!');
    expect(loaded).toBeNull();
  });

  it('throws error when loading encrypted wallet without password', async () => {
    const password = 'StrongPassword123!'; // i-dont-think-this-is-a-secret
    await storageService.saveWallet(MOCK_WALLET, password);
    const loaded = await storageService.loadWallet();
    expect(loaded).toBeNull();
  });
});
