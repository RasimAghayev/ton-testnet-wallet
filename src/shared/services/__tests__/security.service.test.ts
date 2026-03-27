import { describe, it, expect, vi } from 'vitest'

// Mock @ton/core to decouple tests from the TON SDK and the Buffer polyfill.
// Accepts any 48-char string starting with EQ/UQ — mirrors real Address.parse behavior.
vi.mock('@ton/core', () => ({
  Address: {
    parse: vi.fn((addr: string) => {
      const t = addr.trim()
      if (t.length === 48 && /^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(t)) {
        return { toString: () => t }
      }
      throw new Error('Invalid address')
    }),
  },
}))

import { securityService } from '../security.service'

// Real-format 48-char TON testnet addresses (prefix 2 chars + 46 base64url chars)
const VALID_ADDRESS   = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t'
const VALID_ADDRESS_2 = 'UQBvI0aFLnw2QbZgjMPCLRdtRHxhUyinQudg6sdiohIwg5jL'
const ZERO_ADDRESS    = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ'
const INVALID_ADDRESS = 'notanaddress'

describe('securityService.validateAddress', () => {
  it('returns true for a valid UQ address', () => {
    expect(securityService.validateAddress(VALID_ADDRESS)).toBe(true)
  })

  it('returns true for a valid EQ address', () => {
    expect(securityService.validateAddress(VALID_ADDRESS_2)).toBe(true)
  })

  it('returns false for an empty string', () => {
    expect(securityService.validateAddress('')).toBe(false)
  })

  it('returns false for a random string', () => {
    expect(securityService.validateAddress(INVALID_ADDRESS)).toBe(false)
  })

  it('trims whitespace before parsing', () => {
    // Address with leading/trailing spaces should still validate
    expect(securityService.validateAddress(`  ${VALID_ADDRESS}  `)).toBe(true)
  })
})

describe('securityService.checkPastedAddress', () => {
  it('returns safe when pasted value matches clipboard', () => {
    const result = securityService.checkPastedAddress(VALID_ADDRESS, VALID_ADDRESS)
    expect(result.risk).toBe('safe')
  })

  it('returns invalid when pasted value is not a valid address', () => {
    const result = securityService.checkPastedAddress(INVALID_ADDRESS, INVALID_ADDRESS)
    expect(result.risk).toBe('invalid')
    expect(result.reason).toContain('Invalid TON address format')
  })

  it('returns suspicious when pasted value differs from clipboard content', () => {
    // Simulates clipboard hijacking: user copied VALID_ADDRESS_2
    // but the input received VALID_ADDRESS (different address injected)
    const result = securityService.checkPastedAddress(VALID_ADDRESS, VALID_ADDRESS_2)
    expect(result.risk).toBe('suspicious')
    expect(result.reason).toContain('clipboard')
  })

  it('returns safe when clipboard data is empty (browser restriction)', () => {
    // Some browsers block clipboard read — clipboardData will be empty string
    const result = securityService.checkPastedAddress(VALID_ADDRESS, '')
    expect(result.risk).toBe('safe')
  })
})

describe('securityService.assessAddress', () => {
  it('returns safe for a normal valid address', () => {
    const result = securityService.assessAddress(VALID_ADDRESS)
    expect(result.risk).toBe('safe')
  })

  it('returns invalid for a malformed address', () => {
    const result = securityService.assessAddress(INVALID_ADDRESS)
    expect(result.risk).toBe('invalid')
  })

  it('returns suspicious when sending to zero address', () => {
    const result = securityService.assessAddress(ZERO_ADDRESS)
    expect(result.risk).toBe('suspicious')
    expect(result.reason).toContain('zero address')
  })

  it('returns suspicious when recipient equals own address', () => {
    const result = securityService.assessAddress(VALID_ADDRESS, VALID_ADDRESS)
    expect(result.risk).toBe('suspicious')
    expect(result.reason).toContain('own address')
  })

  it('returns safe when recipient is different from own address', () => {
    const result = securityService.assessAddress(VALID_ADDRESS_2, VALID_ADDRESS)
    expect(result.risk).toBe('safe')
  })
})
