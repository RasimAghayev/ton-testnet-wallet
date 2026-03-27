import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { Alert } from '@/shared/components/ui/Alert'
import type { SendFormData } from '../lib/validation'
import type { AddressCheckResult } from '@/shared/services/security.service'

interface ConfirmModalProps {
  isOpen: boolean
  data: SendFormData | null
  addressRisk: AddressCheckResult | null
  isSending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  data,
  addressRisk,
  isSending,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!data) return null

  return (
    <Modal isOpen={isOpen} title="Confirm Transaction" onClose={onCancel}>
      <div className="flex flex-col gap-4">
        {addressRisk?.risk === 'suspicious' && (
          <Alert
            variant="warning"
            message={addressRisk.reason ?? 'Suspicious address detected.'}
          />
        )}

        <div className="flex flex-col gap-3 bg-slate-800/50 rounded-xl p-4">
          <Row label="To" value={data.toAddress} mono />
          <Row label="Amount" value={`${data.amount} TON`} />
          {data.comment && <Row label="Comment" value={data.comment} />}
        </div>

        <p className="text-xs text-slate-500 text-center">
          This transaction is irreversible. Double-check the address before confirming.
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isSending}>
            Cancel
          </Button>
          <Button
            variant={addressRisk?.risk === 'suspicious' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isSending}
          >
            {addressRisk?.risk === 'suspicious' ? 'Send Anyway' : 'Confirm Send'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm text-slate-200 break-all ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}
