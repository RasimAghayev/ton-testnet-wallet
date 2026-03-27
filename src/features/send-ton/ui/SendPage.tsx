import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSend } from '../hooks/useSend'
import { ConfirmModal } from './ConfirmModal'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { Alert } from '@/shared/components/ui/Alert'
import { useClipboardGuard } from '@/shared/hooks/useClipboardGuard'
import { sendSchema } from '../lib/validation'

export function SendPage() {
  const navigate = useNavigate()
  const {
    status,
    txId,
    error,
    pendingData,
    addressRisk,
    checkAddress,
    requestSend,
    confirmSend,
    cancelSend,
    reset,
  } = useSend()

  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pasteWarning, setPasteWarning] = useState<string | null>(null)

  const { onPaste } = useClipboardGuard((result, value) => {
    if (result.risk !== 'safe') {
      setPasteWarning(result.reason ?? 'Suspicious paste detected.')
    } else {
      setPasteWarning(null)
    }
    setToAddress(value)
    checkAddress(value)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const parsed = sendSchema.safeParse({ toAddress, amount, comment: comment || undefined })
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0]) errs[String(issue.path[0])] = issue.message
      })
      setFieldErrors(errs)
      return
    }

    requestSend(parsed.data)
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">
            Transaction Sent
          </h2>
          <p className="text-sm text-slate-400 mb-1">
            Your transaction has been broadcast to the network.
          </p>
          {txId && (
            <p className="text-xs text-slate-500 font-mono mt-2 break-all">
              Seq: {txId}
            </p>
          )}
          <Button className="mt-6 w-full" onClick={() => { reset(); navigate('/dashboard') }}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 py-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-slate-100">Send TON</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Recipient Address"
              value={toAddress}
              onChange={(e) => {
                setToAddress(e.target.value)
                checkAddress(e.target.value)
                setPasteWarning(null)
              }}
              onPaste={onPaste}
              placeholder="UQ..."
              error={fieldErrors.toAddress}
            />
            {pasteWarning && (
              <Alert variant="warning" message={pasteWarning} />
            )}
            {addressRisk?.risk === 'suspicious' && !pasteWarning && (
              <Alert variant="warning" message={addressRisk.reason ?? 'Suspicious address.'} />
            )}
          </div>

          <Input
            label="Amount (TON)"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            error={fieldErrors.amount}
          />

          <Input
            label="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Payment for services"
          />

          {status === 'error' && error && (
            <Alert variant="error" message={error} />
          )}

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={status === 'sending'}
          >
            Review Transaction
          </Button>
        </form>

        <ConfirmModal
          isOpen={status === 'confirming'}
          data={pendingData}
          addressRisk={addressRisk}
          isSending={status === 'sending'}
          onConfirm={confirmSend}
          onCancel={cancelSend}
        />
      </div>
    </div>
  )
}
