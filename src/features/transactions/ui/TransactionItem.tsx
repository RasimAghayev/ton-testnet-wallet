import type { Transaction } from '@/shared/types/transaction'
import { TON_CONFIG } from '@/shared/config/ton'
import { truncateAddress } from '@/shared/utils/format'

interface TransactionItemProps {
  tx: Transaction
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TransactionItem({ tx }: TransactionItemProps) {
  const isIn = tx.type === 'in'

  return (
    <a
      href={`${TON_CONFIG.explorerBase}/transaction/${tx.hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800/50 transition-colors rounded-xl group"
    >
      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${
          isIn
            ? 'bg-emerald-900/50 text-emerald-400'
            : 'bg-red-900/50 text-red-400'
        }`}
      >
        {isIn ? '↓' : '↑'}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{formatDate(tx.timestamp)}</p>
        <p className="text-sm font-mono text-slate-400 truncate">
          {isIn ? 'From: ' : 'To: '}
          {truncateAddress(tx.address, 8, 6)}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-semibold ${
            isIn ? 'text-emerald-400' : 'text-slate-200'
          }`}
        >
          {isIn ? '+' : '-'}
          {parseFloat(tx.amount).toFixed(4)} TON
        </p>
        <p className="text-xs text-slate-600">fee {tx.fee}</p>
      </div>
    </a>
  )
}
