import { internal, fromNano, toNano, SendMode } from '@ton/ton'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { Address } from '@ton/core'
import { TX_FETCH_LIMIT } from '@/shared/config/ton'
import { walletService } from './wallet.service'
import type { Transaction } from '@/shared/types/transaction'

export const tonService = {
  async getBalance(address: string): Promise<string> {
    const client = walletService.getClient()
    const addr = Address.parse(address)
    const balance = await client.getBalance(addr)
    return fromNano(balance)
  },

  async getTransactions(address: string): Promise<Transaction[]> {
    const client = walletService.getClient()
    const addr = Address.parse(address)

    const txs = await client.getTransactions(addr, { limit: TX_FETCH_LIMIT })

    return txs.map((tx) => {
      const isOut = tx.outMessages.size > 0

      let amount = '0'
      let counterparty = ''

      if (isOut) {
        const outMsg = tx.outMessages.get(0)
        amount = outMsg?.info.type === 'internal'
          ? fromNano(outMsg.info.value.coins)
          : '0'
        const dest = outMsg?.info.type === 'internal' ? outMsg.info.dest : null
        counterparty = dest
          ? dest.toString({ testOnly: true, bounceable: false })
          : ''
      } else {
        const inMsg = tx.inMessage
        amount = inMsg?.info.type === 'internal'
          ? fromNano(inMsg.info.value.coins)
          : '0'
        const src = inMsg?.info.type === 'internal' ? inMsg.info.src : null
        counterparty = src
          ? src.toString({ testOnly: true, bounceable: false })
          : ''
      }

      return {
        hash: tx.hash().toString('hex'),
        type: isOut ? 'out' : 'in',
        amount,
        address: counterparty,
        timestamp: tx.now,
        fee: fromNano(tx.totalFees.coins),
      }
    })
  },

  async sendTransaction(params: {
    mnemonic: string[]
    publicKeyHex: string
    toAddress: string
    amount: string
    comment?: string
  }): Promise<string> {
    const client = walletService.getClient()
    const keyPair = await mnemonicToPrivateKey(params.mnemonic)
    const contract = walletService.getContract(params.publicKeyHex)
    const wallet = client.open(contract)

    const seqno = await wallet.getSeqno()

    await wallet.sendTransfer({
      secretKey: keyPair.secretKey,
      seqno,
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: Address.parse(params.toAddress),
          value: toNano(params.amount),
          bounce: false,
          body: params.comment ?? '',
        }),
      ],
    })

    return `${seqno}`
  },
}
