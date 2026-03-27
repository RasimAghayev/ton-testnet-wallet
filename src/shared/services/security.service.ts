import { Address } from '@ton/core'

export type AddressRisk = 'safe' | 'suspicious' | 'invalid'

export interface AddressCheckResult {
  risk: AddressRisk
  reason?: string
}

/**
 * Validates a TON address checksum and format.
 */
function validateAddress(address: string): boolean {
  try {
    Address.parse(address.trim())
    return true
  } catch {
    return false
  }
}

/**
 * Detects if pasted address differs from what is on the clipboard.
 * Browsers restrict clipboard access — we compare the paste event's
 * getData() value with the current input value after paste.
 */
function checkPastedAddress(
  pastedValue: string,
  clipboardData: string,
): AddressCheckResult {
  if (!validateAddress(pastedValue)) {
    return { risk: 'invalid', reason: 'Invalid TON address format.' }
  }

  // If the pasted content differs from what clipboard reports — hijack suspect
  if (clipboardData && pastedValue !== clipboardData) {
    return {
      risk: 'suspicious',
      reason:
        'Pasted address differs from clipboard content. Possible clipboard hijacking detected.',
    }
  }

  return { risk: 'safe' }
}

/**
 * High-level address risk assessment:
 * - format validation
 * - zero-address detection
 * - partial match with own address (accidental self-send)
 */
function assessAddress(
  address: string,
  ownAddress?: string,
): AddressCheckResult {
  if (!validateAddress(address)) {
    return { risk: 'invalid', reason: 'Invalid TON address.' }
  }

  const ZERO_ADDRESS =
    'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ'
  if (address === ZERO_ADDRESS) {
    return { risk: 'suspicious', reason: 'Sending to zero address.' }
  }

  if (ownAddress && address === ownAddress) {
    return {
      risk: 'suspicious',
      reason: 'You are sending funds to your own address.',
    }
  }

  return { risk: 'safe' }
}

export const securityService = {
  validateAddress,
  checkPastedAddress,
  assessAddress,
}
