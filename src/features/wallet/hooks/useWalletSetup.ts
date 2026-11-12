import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletService } from '@/shared/services/wallet.service';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';
import { validatePasswordStrength } from '@/shared/utils/crypto';

export function useWalletSetup() {
  const navigate = useNavigate();
  const setWallet = useWalletStore(s => s.setWallet);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMnemonic, setNewMnemonic] = useState<string[] | null>(null);
  const [encryptionPassword, setEncryptionPassword] = useState<string>('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [enableEncryption, setEnableEncryption] = useState(false);

  const validatePassword = (password: string) => {
    const result = validatePasswordStrength(password);
    setPasswordErrors(result.errors);
    return result.valid;
  };

  const create = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const wallet = await walletService.createWallet();
      setNewMnemonic(wallet.mnemonic);
      await setWallet({ ...wallet, password: enableEncryption ? encryptionPassword : undefined });
    } catch {
      setError('Failed to create wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCreation = () => {
    navigate('/dashboard');
  };

  const importWallet = async (mnemonicInput: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const words = mnemonicInput.trim().split(/\s+/);
      if (words.length !== 24) {
        throw new Error('Mnemonic must be exactly 24 words.');
      }
      const wallet = await walletService.importWallet(words);
      await setWallet({ ...wallet, password: enableEncryption ? encryptionPassword : undefined });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid mnemonic phrase.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEncryptionToggle = (enabled: boolean) => {
    setEnableEncryption(enabled);
    if (!enabled) {
      setEncryptionPassword('');
      setPasswordErrors([]);
    }
  };

  const handlePasswordChange = (password: string) => {
    setEncryptionPassword(password);
    if (password) {
      validatePassword(password);
    } else {
      setPasswordErrors([]);
    }
  };

  const canSubmit = () => {
    if (!enableEncryption) return true;
    return encryptionPassword.length >= 12 && passwordErrors.length === 0;
  };

  return {
    create,
    confirmCreation,
    importWallet,
    isLoading,
    error,
    newMnemonic,
    enableEncryption,
    handleEncryptionToggle,
    encryptionPassword,
    handlePasswordChange,
    passwordErrors,
    canSubmit,
  };
}
