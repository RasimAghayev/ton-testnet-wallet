import { describe, it, expect, beforeEach, vi } from 'vitest'

// Provide a full in-memory localStorage that works in any test environment.
const makeLocalStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear:      () => { store = {} },
    get length() { return Object.keys(store).length },
  }
}
vi.stubGlobal('localStorage', makeLocalStorage())

import { storageService } from '../storage.service'

const MOCK_WALLET = {
  address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  publicKey: 'abc123publickey',
  mnemonic: Array(24).fill('word') as string[],
}

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads a wallet', () => {
    storageService.saveWallet(MOCK_WALLET)
    expect(storageService.loadWallet()).toEqual(MOCK_WALLET)
  })

  it('returns null when no wallet is stored', () => {
    expect(storageService.loadWallet()).toBeNull()
  })

  it('hasWallet returns false when storage is empty', () => {
    expect(storageService.hasWallet()).toBe(false)
  })

  it('hasWallet returns true after saving', () => {
    storageService.saveWallet(MOCK_WALLET)
    expect(storageService.hasWallet()).toBe(true)
  })

  it('clearWallet removes the stored wallet', () => {
    storageService.saveWallet(MOCK_WALLET)
    storageService.clearWallet()
    expect(storageService.loadWallet()).toBeNull()
    expect(storageService.hasWallet()).toBe(false)
  })

  it('loadWallet returns null when storage contains malformed JSON', () => {
    localStorage.setItem('ton_wallet_v1', 'not-valid-json{{{')
    expect(storageService.loadWallet()).toBeNull()
  })
})
