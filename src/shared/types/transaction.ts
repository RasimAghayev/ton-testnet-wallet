export type TransactionType = 'in' | 'out'

export interface Transaction {
  hash: string
  type: TransactionType
  amount: string
  address: string
  timestamp: number
  fee: string
  comment?: string
}
