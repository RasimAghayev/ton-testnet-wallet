import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SetupPage } from '@/features/wallet/ui/SetupPage'
import { Dashboard } from '@/features/wallet/ui/Dashboard'
import { Spinner } from '@/shared/components/ui/Spinner'

// Route-level code-splitting: Send/Receive/Transactions pull in their own
// forms/QR/list rendering and aren't needed on first load (Setup/Dashboard
// are). See docs/TECHNICAL_DEBT.md #6.
const ReceivePage = lazy(() =>
  import('@/features/receive-ton/ui/ReceivePage').then((m) => ({ default: m.ReceivePage })),
)
const SendPage = lazy(() =>
  import('@/features/send-ton/ui/SendPage').then((m) => ({ default: m.SendPage })),
)
const TransactionList = lazy(() =>
  import('@/features/transactions/ui/TransactionList').then((m) => ({ default: m.TransactionList })),
)

function RouteFallback() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/receive" element={<ReceivePage />} />
        <Route path="/send" element={<SendPage />} />
        <Route path="/transactions" element={<TransactionList />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    </Suspense>
  )
}
