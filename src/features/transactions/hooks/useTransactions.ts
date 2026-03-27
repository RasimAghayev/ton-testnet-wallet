import { useState, useEffect, useMemo } from 'react'
import { tonService } from '@/shared/services/ton.service'
import { useWalletStore } from '@/entities/wallet/model/wallet.store'
import type { Transaction } from '@/shared/types/transaction'

export function useTransactions() {
  const address = useWalletStore((s) => s.address)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = async () => {
    if (!address) return
    setIsLoading(true)
    setError(null)
    try {
      const txs = await tonService.getTransactions(address)
      setTransactions(txs)
    } catch {
      setError('Failed to load transactions.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [address]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!query.trim()) return transactions
    const q = query.toLowerCase()
    return transactions.filter(
      (tx) =>
        tx.address.toLowerCase().includes(q) ||
        tx.amount.includes(q) ||
        tx.hash.toLowerCase().includes(q),
    )
  }, [transactions, query])

  return { transactions: filtered, isLoading, error, query, setQuery, reload: load }
}
