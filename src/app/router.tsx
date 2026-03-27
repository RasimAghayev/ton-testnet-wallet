import { Routes, Route, Navigate } from 'react-router-dom'
import { SetupPage } from '@/features/wallet/ui/SetupPage'
import { Dashboard } from '@/features/wallet/ui/Dashboard'
import { ReceivePage } from '@/features/receive-ton/ui/ReceivePage'
import { SendPage } from '@/features/send-ton/ui/SendPage'
import { TransactionList } from '@/features/transactions/ui/TransactionList'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/receive" element={<ReceivePage />} />
      <Route path="/send" element={<SendPage />} />
      <Route path="/transactions" element={<TransactionList />} />
      <Route path="*" element={<Navigate to="/setup" replace />} />
    </Routes>
  )
}
