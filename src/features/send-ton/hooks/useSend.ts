import { useState } from 'react'
import { tonService } from '@/shared/services/ton.service'
import { securityService, type AddressCheckResult } from '@/shared/services/security.service'
import { useWalletStore } from '@/entities/wallet/model/wallet.store'
import { sendSchema, type SendFormData } from '../lib/validation'

type SendStatus = 'idle' | 'confirming' | 'sending' | 'success' | 'error'

export function useSend() {
  const { address, publicKey, mnemonic } = useWalletStore()
  const [status, setStatus] = useState<SendStatus>('idle')
  const [txId, setTxId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingData, setPendingData] = useState<SendFormData | null>(null)
  const [addressRisk, setAddressRisk] = useState<AddressCheckResult | null>(null)

  const validate = (data: Partial<SendFormData>) => {
    return sendSchema.safeParse(data)
  }

  const checkAddress = (addr: string) => {
    if (!addr) return
    const result = securityService.assessAddress(addr, address ?? undefined)
    setAddressRisk(result)
    return result
  }

  const requestSend = (data: SendFormData) => {
    const risk = securityService.assessAddress(data.toAddress, address ?? undefined)
    setAddressRisk(risk)
    setPendingData(data)
    setStatus('confirming')
  }

  const confirmSend = async () => {
    if (!pendingData || !mnemonic || !publicKey) return
    setStatus('sending')
    setError(null)
    try {
      const id = await tonService.sendTransaction({
        mnemonic,
        publicKeyHex: publicKey,
        toAddress: pendingData.toAddress,
        amount: pendingData.amount,
        comment: pendingData.comment,
      })
      setTxId(id)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed.')
      setStatus('error')
    }
  }

  const cancelSend = () => {
    setStatus('idle')
    setPendingData(null)
    setAddressRisk(null)
  }

  const reset = () => {
    setStatus('idle')
    setPendingData(null)
    setAddressRisk(null)
    setTxId(null)
    setError(null)
  }

  return {
    status,
    txId,
    error,
    pendingData,
    addressRisk,
    validate,
    checkAddress,
    requestSend,
    confirmSend,
    cancelSend,
    reset,
  }
}
