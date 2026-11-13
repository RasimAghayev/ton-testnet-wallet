import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  saveWallet: vi.fn(),
  loadWallet: vi.fn(),
  clearWallet: vi.fn(),
  isEncrypted: vi.fn(),
}));

vi.mock('@/shared/services/storage.service', () => ({
  storageService: {
    saveWallet: mocks.saveWallet,
    loadWallet: mocks.loadWallet,
    clearWallet: mocks.clearWallet,
    isEncrypted: mocks.isEncrypted,
  },
}));

import { useWalletStore } from '../wallet.store';

const WALLET = {
  address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  publicKey: 'abc123publickey',
  mnemonic: Array(24).fill('word') as string[],
};

const INITIAL = {
  address: null,
  publicKey: null,
  mnemonic: null,
  balance: null,
  isLoading: false,
  error: null,
  isEncrypted: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.saveWallet.mockResolvedValue(undefined);
  mocks.loadWallet.mockResolvedValue(null);
  mocks.clearWallet.mockReturnValue(undefined);
  mocks.isEncrypted.mockResolvedValue(false);
  useWalletStore.setState(INITIAL);
});

describe('walletStore.setWallet', () => {
  it('TC_STORE_SET_001 persists and stores an unencrypted wallet', async () => {
    await useWalletStore.getState().setWallet(WALLET);

    expect(mocks.saveWallet).toHaveBeenCalledWith(WALLET, undefined);
    const state = useWalletStore.getState();
    expect(state.address).toBe(WALLET.address);
    expect(state.publicKey).toBe(WALLET.publicKey);
    expect(state.mnemonic).toEqual(WALLET.mnemonic);
    expect(state.isEncrypted).toBe(false);
  });

  it('TC_STORE_SET_002 marks an encrypted wallet when a password is supplied', async () => {
    await useWalletStore.getState().setWallet({ ...WALLET, password: 'pw' });

    expect(mocks.saveWallet).toHaveBeenCalledWith(WALLET, 'pw');
    expect(useWalletStore.getState().isEncrypted).toBe(true);
  });

  it('TC_STORE_SET_003 clears a previous error', async () => {
    useWalletStore.setState({ error: 'old' });
    await useWalletStore.getState().setWallet(WALLET);
    expect(useWalletStore.getState().error).toBeNull();
  });
});

describe('walletStore simple setters', () => {
  it('TC_STORE_SET_004 setBalance updates the balance', () => {
    useWalletStore.getState().setBalance('1.25');
    expect(useWalletStore.getState().balance).toBe('1.25');
  });

  it('TC_STORE_SET_005 setLoading updates loading', () => {
    useWalletStore.getState().setLoading(true);
    expect(useWalletStore.getState().isLoading).toBe(true);
  });

  it('TC_STORE_SET_006 setError updates the error', () => {
    useWalletStore.getState().setError('boom');
    expect(useWalletStore.getState().error).toBe('boom');
  });
});

describe('walletStore.clearWallet', () => {
  it('TC_STORE_CLEAR_001 removes storage and resets state', () => {
    useWalletStore.setState({ ...INITIAL, address: WALLET.address, balance: '3' });

    useWalletStore.getState().clearWallet();

    expect(mocks.clearWallet).toHaveBeenCalled();
    expect(useWalletStore.getState()).toMatchObject(INITIAL);
  });
});

describe('walletStore.loadFromStorage', () => {
  it('TC_STORE_LOAD_001 loads an existing wallet', async () => {
    mocks.loadWallet.mockResolvedValue(WALLET);
    mocks.isEncrypted.mockResolvedValue(true);

    await expect(useWalletStore.getState().loadFromStorage()).resolves.toBe(true);

    const state = useWalletStore.getState();
    expect(state.address).toBe(WALLET.address);
    expect(state.isLoading).toBe(false);
    expect(state.isEncrypted).toBe(true);
  });

  it('TC_STORE_LOAD_002 returns false and stays idle when nothing is stored', async () => {
    mocks.loadWallet.mockResolvedValue(null);

    await expect(useWalletStore.getState().loadFromStorage()).resolves.toBe(false);

    expect(useWalletStore.getState().isLoading).toBe(false);
    expect(useWalletStore.getState().address).toBeNull();
  });

  it('TC_STORE_LOAD_003 surfaces a load failure', async () => {
    mocks.loadWallet.mockRejectedValue(new Error('crypto unavailable'));

    await expect(useWalletStore.getState().loadFromStorage()).resolves.toBe(false);

    expect(useWalletStore.getState().error).toBe('Failed to load wallet');
    expect(useWalletStore.getState().isLoading).toBe(false);
  });
});

describe('walletStore.unlockWallet', () => {
  it('TC_STORE_UNLOCK_001 unlocks with the correct password', async () => {
    mocks.loadWallet.mockResolvedValue(WALLET);

    await expect(useWalletStore.getState().unlockWallet('pw')).resolves.toBe(true);

    const state = useWalletStore.getState();
    expect(state.address).toBe(WALLET.address);
    expect(state.isEncrypted).toBe(true);
    expect(state.error).toBeNull();
  });

  it('TC_STORE_UNLOCK_002 rejects a wrong password', async () => {
    mocks.loadWallet.mockResolvedValue(null);

    await expect(useWalletStore.getState().unlockWallet('bad')).resolves.toBe(false);

    expect(useWalletStore.getState().error).toBe('Invalid password');
    expect(useWalletStore.getState().isLoading).toBe(false);
  });

  it('TC_STORE_UNLOCK_003 surfaces an unexpected failure', async () => {
    mocks.loadWallet.mockRejectedValue(new Error('boom'));

    await expect(useWalletStore.getState().unlockWallet('pw')).resolves.toBe(false);

    expect(useWalletStore.getState().error).toBe('Failed to unlock wallet');
  });
});

describe('walletStore.checkEncryptionStatus', () => {
  it('TC_STORE_STATUS_001 reflects storage encryption state', async () => {
    mocks.isEncrypted.mockResolvedValue(true);

    await useWalletStore.getState().checkEncryptionStatus();

    expect(useWalletStore.getState().isEncrypted).toBe(true);
  });
});
