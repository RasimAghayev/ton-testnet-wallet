import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionItem } from './TransactionItem'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import { Alert } from '@/shared/components/ui/Alert'

export function TransactionList() {
  const navigate = useNavigate()
  const { transactions, isLoading, error, query, setQuery, reload } =
    useTransactions()

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 py-4 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-slate-100">Transactions</h1>
          <button
            onClick={reload}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search by address or amount..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4">
              <Alert variant="error" message={error} />
              <Button variant="secondary" className="w-full mt-3" onClick={reload}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && transactions.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-500 text-sm">
                {query ? 'No transactions match your search.' : 'No transactions yet.'}
              </p>
            </div>
          )}

          {!isLoading &&
            transactions.map((tx) => <TransactionItem key={tx.hash} tx={tx} />)}
        </div>
      </div>
    </div>
  )
}
