import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { Input } from '@/shared/components/ui/Input';
import { useWalletSetup } from '../hooks/useWalletSetup';

export function ImportWallet() {
  const {
    importWallet,
    isLoading,
    error,
    enableEncryption,
    handleEncryptionToggle,
    encryptionPassword,
    handlePasswordChange,
    passwordErrors,
    canSubmit,
  } = useWalletSetup();
  const [phrase, setPhrase] = useState('');

  const wordCount = phrase.trim() ? phrase.trim().split(/\s+/).length : 0;
  const isValidPhrase = wordCount === 24;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Import existing wallet</h2>
        <p className="text-sm text-slate-400">
          Enter your 24-word recovery phrase, separated by spaces.
        </p>
      </div>

      {error && <Alert variant="error" message={error} />}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Recovery phrase</label>
        <textarea
          value={phrase}
          onChange={e => setPhrase(e.target.value)}
          placeholder="word1 word2 word3 ..."
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
        />
        <p className="text-xs text-slate-500">{wordCount} / 24 words</p>
      </div>

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

      <Alert
        variant="warning"
        message="Only import on a device you trust. Your phrase is stored locally."
      />

      <Button
        onClick={() => importWallet(phrase)}
        isLoading={isLoading}
        disabled={!isValidPhrase || !canSubmit()}
        className="w-full"
      >
        Import Wallet
      </Button>
    </div>
  );
}
