import { create } from 'zustand'
import { storageService } from '@/shared/services/storage.service'

interface WalletStore {
  address: string | null
  publicKey: string | null
  mnemonic: string[] | null
  balance: string | null
  isLoading: boolean
  error: string | null

  setWallet: (params: {
    address: string
    publicKey: string
    mnemonic: string[]
  }) => void
  setBalance: (balance: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearWallet: () => void
  loadFromStorage: () => boolean
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: null,
  publicKey: null,
  mnemonic: null,
  balance: null,
  isLoading: false,
  error: null,

  setWallet: ({ address, publicKey, mnemonic }) => {
    storageService.saveWallet({ address, publicKey, mnemonic })
    set({ address, publicKey, mnemonic, error: null })
  },

  setBalance: (balance) => set({ balance }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearWallet: () => {
    storageService.clearWallet()
    set({
      address: null,
      publicKey: null,
      mnemonic: null,
      balance: null,
      error: null,
    })
  },

  loadFromStorage: () => {
    const stored = storageService.loadWallet()
    if (!stored) return false
    set({
      address: stored.address,
      publicKey: stored.publicKey,
      mnemonic: stored.mnemonic,
    })
    return true
  },
}))
