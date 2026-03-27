export interface WalletData {
  address: string
  publicKey: string
  mnemonic: string[]
}

export interface WalletState {
  address: string | null
  publicKey: string | null
  balance: string | null
  isLoading: boolean
  error: string | null
}
