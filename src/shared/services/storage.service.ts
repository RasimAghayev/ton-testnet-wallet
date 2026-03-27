import { APP_CONFIG } from '@/shared/config/app'

interface StoredWallet {
  address: string
  publicKey: string
  mnemonic: string[]
}

const WALLET_KEY = APP_CONFIG.storageKeys.wallet

export const storageService = {
  saveWallet(wallet: StoredWallet): void {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet))
  },

  loadWallet(): StoredWallet | null {
    const raw = localStorage.getItem(WALLET_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredWallet
    } catch {
      return null
    }
  },

  clearWallet(): void {
    localStorage.removeItem(WALLET_KEY)
  },

  hasWallet(): boolean {
    return localStorage.getItem(WALLET_KEY) !== null
  },
}
