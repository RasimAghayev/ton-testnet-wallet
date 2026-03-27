import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Alert } from '@/shared/components/ui/Alert'
import { useWalletSetup } from '../hooks/useWalletSetup'

export function ImportWallet() {
  const { importWallet, isLoading, error } = useWalletSetup()
  const [phrase, setPhrase] = useState('')

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-1">
          Import existing wallet
        </h2>
        <p className="text-sm text-slate-400">
          Enter your 24-word recovery phrase, separated by spaces.
        </p>
      </div>

      {error && <Alert variant="error" message={error} />}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">
          Recovery phrase
        </label>
        <textarea
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="word1 word2 word3 ..."
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
        />
        <p className="text-xs text-slate-500">
          {phrase.trim() ? `${phrase.trim().split(/\s+/).length} / 24 words` : '0 / 24 words'}
        </p>
      </div>

      <Alert
        variant="warning"
        message="Only import on a device you trust. Your phrase is stored locally."
      />

      <Button
        onClick={() => importWallet(phrase)}
        isLoading={isLoading}
        disabled={phrase.trim().split(/\s+/).length !== 24}
        className="w-full"
      >
        Import Wallet
      </Button>
    </div>
  )
}
