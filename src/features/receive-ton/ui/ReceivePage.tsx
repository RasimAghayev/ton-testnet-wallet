import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useReceive } from '../hooks/useReceive'
import { CopyButton } from '@/shared/components/ui/CopyButton'
import { Button } from '@/shared/components/ui/Button'

export function ReceivePage() {
  const navigate = useNavigate()
  const { address } = useReceive()

  if (!address) return null

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
          <h1 className="text-lg font-semibold text-slate-100">Receive TON</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-6">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={address} size={180} level="M" />
          </div>

          {/* Address */}
          <div className="w-full">
            <p className="text-xs text-slate-500 uppercase tracking-wider text-center mb-2">
              Your TON Testnet Address
            </p>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-sm font-mono text-slate-200 break-all text-center leading-relaxed">
                {address}
              </p>
            </div>
          </div>

          <CopyButton text={address} label="Copy address" />

          <p className="text-xs text-slate-500 text-center px-4">
            Only send TON testnet tokens to this address. This is a testnet
            wallet.
          </p>
        </div>

        <Button
          variant="secondary"
          className="w-full mt-4"
          onClick={() => navigate('/dashboard')}
        >
          Done
        </Button>
      </div>
    </div>
  )
}
