import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { Input } from '@/shared/components/ui/Input';
import { useWalletSetup } from '../hooks/useWalletSetup';

export function CreateWallet() {
  const {
    create,
    confirmCreation,
    isLoading,
    error,
    newMnemonic,
    enableEncryption,
    handleEncryptionToggle,
    encryptionPassword,
    handlePasswordChange,
    passwordErrors,
    canSubmit,
  } = useWalletSetup();

  if (newMnemonic) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Save your recovery phrase</h2>
          <p className="text-sm text-slate-400">
            Write down these 24 words in order and store them safely. This is the only way to
            recover your wallet.
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
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Create new wallet</h2>
        <p className="text-sm text-slate-400">
          A new 24-word recovery phrase will be generated for you.
        </p>
      </div>

      {error && <Alert variant="error" message={error} />}

      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enableEncryption}
            onChange={e => handleEncryptionToggle(e.target.checked)}
            className="w-4 h-4 text-blue-500 border-slate-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-slate-300">Encrypt wallet with password (recommended)</span>
        </label>

        {enableEncryption && (
          <div className="space-y-2 pl-6 border-l-2 border-slate-700/50 ml-2">
            <Input
              label="Encryption password"
              type="password"
              value={encryptionPassword}
              onChange={e => handlePasswordChange(e.target.value)}
              placeholder="Min 12 chars, upper, lower, number, special"
              error={passwordErrors[0]}
              hint={
                passwordErrors.length > 0
                  ? undefined
                  : 'Used to encrypt your mnemonic locally with AES-GCM + PBKDF2'
              }
            />
            {passwordErrors.length > 0 && (
              <div className="text-xs text-amber-400 space-y-1">
                {passwordErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Button onClick={create} isLoading={isLoading} disabled={!canSubmit()} className="w-full">
        Generate Wallet
      </Button>
    </div>
  );
}
