import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mocks = vi.hoisted(() => ({
  createWallet: vi.fn(),
  importWallet: vi.fn(),
  saveWallet: vi.fn(),
  loadWallet: vi.fn(),
  clearWallet: vi.fn(),
  isEncrypted: vi.fn(),
}));

vi.mock('@/shared/services/wallet.service', () => ({
  walletService: { createWallet: mocks.createWallet, importWallet: mocks.importWallet },
}));

vi.mock('@/shared/services/storage.service', () => ({
  storageService: {
    saveWallet: mocks.saveWallet,
    loadWallet: mocks.loadWallet,
    clearWallet: mocks.clearWallet,
    isEncrypted: mocks.isEncrypted,
  },
}));

import { useWalletSetup } from '../useWalletSetup';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

const WALLET = {
  address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  publicKey: 'abc',
  mnemonic: Array(24).fill('word') as string[],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  mocks.saveWallet.mockResolvedValue(undefined);
  mocks.loadWallet.mockResolvedValue(null);
  mocks.clearWallet.mockReturnValue(undefined);
  mocks.isEncrypted.mockResolvedValue(false);
  useWalletStore.setState({
    address: null,
    publicKey: null,
    mnemonic: null,
    balance: null,
    error: null,
    isLoading: false,
    isEncrypted: false,
  });
});

describe('useWalletSetup.create', () => {
  it('TC_SETUP_CREATE_001 creates a wallet and exposes the mnemonic', async () => {
    mocks.createWallet.mockResolvedValue(WALLET);
    const { result } = renderHook(() => useWalletSetup());

    await act(async () => {
      await result.current.create();
    });

    expect(result.current.newMnemonic).toEqual(WALLET.mnemonic);
    expect(mocks.saveWallet).toHaveBeenCalledWith(
      expect.objectContaining({ address: WALLET.address }),
      undefined
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('TC_SETUP_CREATE_002 reports a creation failure', async () => {
    mocks.createWallet.mockRejectedValue(new Error('no entropy'));
    const { result } = renderHook(() => useWalletSetup());

    await act(async () => {
      await result.current.create();
    });

    expect(result.current.error).toBe('Failed to create wallet. Please try again.');
    expect(result.current.newMnemonic).toBeNull();
  });

  it('TC_SETUP_CREATE_003 confirmCreation navigates to the dashboard', () => {
    const { result } = renderHook(() => useWalletSetup());
    act(() => result.current.confirmCreation());
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});

describe('useWalletSetup.importWallet', () => {
  it('TC_SETUP_IMPORT_001 imports a 24-word phrase and navigates', async () => {
    mocks.importWallet.mockResolvedValue(WALLET);
    const { result } = renderHook(() => useWalletSetup());
    const phrase = Array(24).fill('word').join(' ');

    await act(async () => {
      await result.current.importWallet(phrase);
    });

    expect(mocks.importWallet).toHaveBeenCalledWith(Array(24).fill('word'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('TC_SETUP_IMPORT_002 rejects a phrase without exactly 24 words', async () => {
    const { result } = renderHook(() => useWalletSetup());

    await act(async () => {
      await result.current.importWallet('one two three');
    });

    expect(result.current.error).toBe('Mnemonic must be exactly 24 words.');
    expect(mocks.importWallet).not.toHaveBeenCalled();
  });

  it('TC_SETUP_IMPORT_003 surfaces an SDK import failure', async () => {
    mocks.importWallet.mockRejectedValue(new Error('Invalid mnemonic phrase.'));
    const { result } = renderHook(() => useWalletSetup());

    await act(async () => {
      await result.current.importWallet(Array(24).fill('word').join(' '));
    });

    expect(result.current.error).toBe('Invalid mnemonic phrase.');
  });
});

describe('useWalletSetup password handling', () => {
  it('TC_SETUP_PWD_001 reports strength errors for a weak password', () => {
    const { result } = renderHook(() => useWalletSetup());
    act(() => result.current.handlePasswordChange('weak'));
    expect(result.current.passwordErrors.length).toBeGreaterThan(0);
    expect(result.current.passwordErrors[0]).toContain('at least 12 characters');
  });

  it('TC_SETUP_PWD_002 clears errors when the field is emptied', () => {
    const { result } = renderHook(() => useWalletSetup());
    act(() => {
      result.current.handlePasswordChange('weak');
      result.current.handlePasswordChange('');
    });
    expect(result.current.passwordErrors).toHaveLength(0);
  });

  it('TC_SETUP_PWD_003 toggle resets the password when disabled', () => {
    const { result } = renderHook(() => useWalletSetup());
    act(() => {
      result.current.handleEncryptionToggle(true);
      result.current.handlePasswordChange('StrongPassword123!'); // i-dont-think-this-is-a-secret
      result.current.handleEncryptionToggle(false);
    });
    expect(result.current.enableEncryption).toBe(false);
    expect(result.current.encryptionPassword).toBe('');
    expect(result.current.passwordErrors).toHaveLength(0);
  });

  it('TC_SETUP_PWD_004 canSubmit requires a strong password when encrypting', () => {
    const { result } = renderHook(() => useWalletSetup());

    expect(result.current.canSubmit()).toBe(true);

    act(() => result.current.handleEncryptionToggle(true));
    expect(result.current.canSubmit()).toBe(false);

    act(() => result.current.handlePasswordChange('StrongPassword123!')); // i-dont-think-this-is-a-secret
    expect(result.current.canSubmit()).toBe(true);
  });
});
