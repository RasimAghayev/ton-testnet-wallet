import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { Input } from '@/shared/components/ui/Input';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

export function UnlockPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const unlockWallet = useWalletStore(s => s.unlockWallet);
  const isLoading = useWalletStore(s => s.isLoading);
  const error = useWalletStore(s => s.error);
  const isEncrypted = useWalletStore(s => s.isEncrypted);
  const address = useWalletStore(s => s.address);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: string })?.from || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await unlockWallet(password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleForgotPassword = () => {
    if (
      window.confirm(
        'Forgot password? This will permanently delete your encrypted wallet data. You can then import your wallet again using your 24-word recovery phrase. Continue?'
      )
    ) {
      useWalletStore.getState().clearWallet();
      navigate('/setup', { replace: true });
    }
  };

  // If already unlocked, redirect
  if (address && !isEncrypted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-slate-100">Wallet Encrypted</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your password to unlock</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5">
            {error && <Alert variant="error" message={error} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Encryption password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                hint="This password decrypts your locally stored mnemonic"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={e => setShowPassword(e.target.checked)}
                    className="w-4 h-4 text-blue-500 border-slate-600 rounded focus:ring-blue-500"
                  />
                  Show password
                </label>
              </div>

              <Button type="submit" isLoading={isLoading} disabled={!password} className="w-full">
                Unlock Wallet
              </Button>
            </form>

            <Button
              variant="ghost"
              onClick={handleForgotPassword}
              className="w-full mt-4 text-red-400 hover:text-red-300"
            >
              Forgot password? Reset wallet
            </Button>

            <p className="mt-4 text-center text-xs text-slate-500">
              Your wallet is encrypted with AES-GCM + PBKDF2 (100,000 iterations). Without the
              password, the mnemonic cannot be recovered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
