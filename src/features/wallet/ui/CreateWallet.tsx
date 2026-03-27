import { Button } from '@/shared/components/ui/Button'
import { Alert } from '@/shared/components/ui/Alert'
import { useWalletSetup } from '../hooks/useWalletSetup'

export function CreateWallet() {
  const { create, confirmCreation, isLoading, error, newMnemonic } =
    useWalletSetup()

  if (newMnemonic) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 mb-1">
            Save your recovery phrase
          </h2>
          <p className="text-sm text-slate-400">
            Write down these 24 words in order and store them safely. This is
            the only way to recover your wallet.
          </p>
        </div>

        <Alert
          variant="warning"
          message="Never share your recovery phrase with anyone. Anyone with these words controls your funds."
        />

        <div className="grid grid-cols-3 gap-2">
          {newMnemonic.map((word, i) => (
            <div
              key={i}
              className="flex gap-2 items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
            >
              <span className="text-xs text-slate-500 w-5 shrink-0">{i + 1}.</span>
              <span className="text-sm font-mono text-slate-100">{word}</span>
            </div>
          ))}
        </div>

        <Button onClick={confirmCreation} className="w-full">
          I have saved my phrase — Continue
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-1">
          Create new wallet
        </h2>
        <p className="text-sm text-slate-400">
          A new 24-word recovery phrase will be generated for you.
        </p>
      </div>

      {error && <Alert variant="error" message={error} />}

      <Button onClick={create} isLoading={isLoading} className="w-full">
        Generate Wallet
      </Button>
    </div>
  )
}
