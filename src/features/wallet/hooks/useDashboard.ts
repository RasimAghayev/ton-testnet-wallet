import { useEffect, useCallback } from 'react'
import { tonService } from '@/shared/services/ton.service'
import { useWalletStore } from '@/entities/wallet/model/wallet.store'
import { APP_CONFIG } from '@/shared/config/app'

export function useDashboard() {
  const { address, balance, setBalance, setError } = useWalletStore()

  const refresh = useCallback(async () => {
    if (!address) return
    try {
      const bal = await tonService.getBalance(address)
      setBalance(bal)
    } catch {
      setError('Failed to fetch balance.')
    }
  }, [address, setBalance, setError])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, APP_CONFIG.balanceRefreshInterval)
    return () => clearInterval(id)
  }, [refresh])

  return { address, balance, refresh }
}
