import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto'
import { WalletContractV4, TonClient } from '@ton/ton'
import { TON_CONFIG, TON_WORKCHAIN } from '@/shared/config/ton'
import type { WalletData } from '@/shared/types/wallet'

function getClient(): TonClient {
  return new TonClient({
    endpoint: TON_CONFIG.endpoint,
    apiKey: TON_CONFIG.apiKey || undefined,
  })
}

export const walletService = {
  async createWallet(): Promise<WalletData> {
    const mnemonic = await mnemonicNew(24)
    return walletService.importWallet(mnemonic)
  },

  async importWallet(mnemonic: string[]): Promise<WalletData> {
    const keyPair = await mnemonicToPrivateKey(mnemonic)
    const contract = WalletContractV4.create({
      workchain: TON_WORKCHAIN,
      publicKey: keyPair.publicKey,
    })
    const address = contract.address.toString({
      testOnly: true,
      bounceable: false,
    })
    return {
      address,
      publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
      mnemonic,
    }
  },

  async getKeyPair(mnemonic: string[]) {
    return mnemonicToPrivateKey(mnemonic)
  },

  getContract(publicKeyHex: string): WalletContractV4 {
    const publicKey = Buffer.from(publicKeyHex, 'hex')
    return WalletContractV4.create({
      workchain: TON_WORKCHAIN,
      publicKey,
    })
  },

  getClient,
}
