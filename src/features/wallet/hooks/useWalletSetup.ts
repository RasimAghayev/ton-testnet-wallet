import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletService } from '@/shared/services/wallet.service'
import { useWalletStore } from '@/entities/wallet/model/wallet.store'

export function useWalletSetup() {
  const navigate = useNavigate()
  const setWallet = useWalletStore((s) => s.setWallet)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMnemonic, setNewMnemonic] = useState<string[] | null>(null)

  const create = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const wallet = await walletService.createWallet()
      setNewMnemonic(wallet.mnemonic)
      setWallet(wallet)
    } catch {
      setError('Failed to create wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmCreation = () => {
    navigate('/dashboard')
  }

  const importWallet = async (mnemonicInput: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const words = mnemonicInput.trim().split(/\s+/)
      if (words.length !== 24) {
        throw new Error('Mnemonic must be exactly 24 words.')
      }
      const wallet = await walletService.importWallet(words)
      setWallet(wallet)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid mnemonic phrase.')
    } finally {
      setIsLoading(false)
    }
  }

  return { create, confirmCreation, importWallet, isLoading, error, newMnemonic }
}
