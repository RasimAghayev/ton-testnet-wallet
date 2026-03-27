import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { CopyButton } from '@/shared/components/ui/CopyButton'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import { useWalletStore } from '@/entities/wallet/model/wallet.store'
import { TON_CONFIG } from '@/shared/config/ton'
import { truncateAddress } from '@/shared/utils/format'

export function Dashboard() {
  const navigate = useNavigate()
  const { address, balance, refresh } = useDashboard()
  const clearWallet = useWalletStore((s) => s.clearWallet)

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to remove this wallet?')) {
      clearWallet()
      navigate('/setup')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">💎</span>
            <span className="font-semibold text-slate-100">TON Wallet</span>
            <span className="text-xs text-amber-400 bg-amber-900/30 border border-amber-800 px-2 py-0.5 rounded-full">
              Testnet
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 mb-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            Total Balance
          </p>
          <div className="flex items-end gap-2 mb-4">
            {balance === null ? (
              <Spinner size="md" />
            ) : (
              <>
                <span className="text-4xl font-bold text-slate-100">
                  {parseFloat(balance).toFixed(4)}
                </span>
                <span className="text-lg text-slate-400 mb-1">TON</span>
              </>
            )}
          </div>

          {address && (
            <div className="flex items-center gap-2 bg-slate-950/50 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-slate-400 flex-1 truncate">
                {truncateAddress(address)}
              </span>
              <CopyButton text={address} label="Copy" />
              <a
                href={`${TON_CONFIG.explorerBase}/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
              >
                ↗
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            variant="primary"
            className="w-full py-3"
            onClick={() => navigate('/send')}
          >
            ↑ Send
          </Button>
          <Button
            variant="secondary"
            className="w-full py-3"
            onClick={() => navigate('/receive')}
          >
            ↓ Receive
          </Button>
        </div>

        {/* Transactions shortcut */}
        <button
          onClick={() => navigate('/transactions')}
          className="w-full flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 transition-colors cursor-pointer"
        >
          <span className="text-sm font-medium text-slate-300">
            Transaction History
          </span>
          <span className="text-slate-500">→</span>
        </button>

        {/* Testnet Faucet */}
        {balance !== null && parseFloat(balance) === 0 && (
          <a
            href="https://t.me/testgiver_ton_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full flex items-center justify-between p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl hover:border-emerald-600 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-emerald-400">Get test TON</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                @testgiver_ton_bot — free testnet tokens
              </p>
            </div>
            <span className="text-emerald-600">↗</span>
          </a>
        )}

        {/* Refresh */}
        <button
          onClick={refresh}
          className="mt-4 w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-2 cursor-pointer"
        >
          ↻ Refresh balance
        </button>
      </div>
    </div>
  )
}
