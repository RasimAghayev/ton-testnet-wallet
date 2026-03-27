import { useWalletStore } from '@/entities/wallet/model/wallet.store'

export function useReceive() {
  const address = useWalletStore((s) => s.address)
  return { address }
}
