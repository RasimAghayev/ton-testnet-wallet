import { create } from 'zustand';
import { storageService } from '@/shared/services/storage.service';

interface WalletStore {
  address: string | null;
  publicKey: string | null;
  mnemonic: string[] | null;
  balance: string | null;
  isLoading: boolean;
  error: string | null;
  isEncrypted: boolean;

  setWallet: (params: {
    address: string;
    publicKey: string;
    mnemonic: string[];
    password?: string;
  }) => Promise<void>;
  setBalance: (balance: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearWallet: () => void;
  loadFromStorage: (password?: string) => Promise<boolean>;
  unlockWallet: (password: string) => Promise<boolean>;
  checkEncryptionStatus: () => Promise<void>;
}

export const useWalletStore = create<WalletStore>(set => ({
  address: null,
  publicKey: null,
  mnemonic: null,
  balance: null,
  isLoading: false,
  error: null,
  isEncrypted: false,

  setWallet: async ({ address, publicKey, mnemonic, password }) => {
    await storageService.saveWallet({ address, publicKey, mnemonic }, password);
    set({ address, publicKey, mnemonic, error: null, isEncrypted: !!password });
  },

  setBalance: balance => set({ balance }),

  setLoading: isLoading => set({ isLoading }),

  setError: error => set({ error }),

  clearWallet: () => {
    storageService.clearWallet();
    set({
      address: null,
      publicKey: null,
      mnemonic: null,
      balance: null,
      error: null,
      isEncrypted: false,
    });
  },

  loadFromStorage: async (password?: string) => {
    set({ isLoading: true, error: null });
    try {
      const wallet = await storageService.loadWallet(password);
      if (!wallet) {
        set({ isLoading: false });
        return false;
      }
      set({
        address: wallet.address,
        publicKey: wallet.publicKey,
        mnemonic: wallet.mnemonic,
        isLoading: false,
        isEncrypted: await storageService.isEncrypted(),
      });
      return true;
    } catch {
      set({ isLoading: false, error: 'Failed to load wallet' });
      return false;
    }
  },

  unlockWallet: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      const wallet = await storageService.loadWallet(password);
      if (!wallet) {
        set({ isLoading: false, error: 'Invalid password' });
        return false;
      }
      set({
        address: wallet.address,
        publicKey: wallet.publicKey,
        mnemonic: wallet.mnemonic,
        isLoading: false,
        isEncrypted: true,
      });
      return true;
    } catch {
      set({ isLoading: false, error: 'Failed to unlock wallet' });
      return false;
    }
  },

  checkEncryptionStatus: async () => {
    const encrypted = await storageService.isEncrypted();
    set({ isEncrypted: encrypted });
  },
}));
