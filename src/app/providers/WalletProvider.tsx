import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWalletStore } from '@/entities/wallet/model/wallet.store'

const PUBLIC_ROUTES = ['/setup']

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const loadFromStorage = useWalletStore((s) => s.loadFromStorage)
  const address = useWalletStore((s) => s.address)

  useEffect(() => {
    const loaded = loadFromStorage()
    if (!loaded && !PUBLIC_ROUTES.includes(location.pathname)) {
      navigate('/setup', { replace: true })
    }
    if (loaded && location.pathname === '/setup') {
      navigate('/dashboard', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Guard on address changes (e.g., after clearWallet)
  useEffect(() => {
    if (address === null && !PUBLIC_ROUTES.includes(location.pathname)) {
      navigate('/setup', { replace: true })
    }
  }, [address, location.pathname, navigate])

  return <>{children}</>
}
