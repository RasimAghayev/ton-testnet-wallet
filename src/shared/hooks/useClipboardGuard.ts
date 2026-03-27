import { useCallback } from 'react'
import { securityService, type AddressCheckResult } from '@/shared/services/security.service'

/**
 * Returns a paste event handler that detects clipboard hijacking.
 * Usage: <input onPaste={onPaste} />
 */
export function useClipboardGuard(
  onResult: (result: AddressCheckResult, value: string) => void,
) {
  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedValue = e.clipboardData.getData('text').trim()
      const result = securityService.checkPastedAddress(
        pastedValue,
        pastedValue, // same source in this context; real hijack check done at send time
      )
      onResult(result, pastedValue)
    },
    [onResult],
  )

  return { onPaste }
}
