import { describe, it, expect, vi } from 'vitest'

// Isolate validation logic from the real TON SDK and the Buffer polyfill.
// Accepts 48-char EQ/UQ addresses — mirrors real Address.parse behavior.
vi.mock('@ton/core', () => ({
  Address: {
    parse: vi.fn((addr: string) => {
      const t = addr.trim()
      if (t.length === 48 && /^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(t)) return {}
      throw new Error('Invalid address')
    }),
  },
}))

import { sendSchema } from '../validation'

// Real-format 48-char TON testnet address
const VALID_ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t'

function parse(data: { toAddress: string; amount: string; comment?: string }) {
  return sendSchema.safeParse(data)
}

describe('sendSchema — toAddress', () => {
  it('passes for a valid TON address', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '0.1' })
    expect(r.success).toBe(true)
  })

  it('fails when address is empty', () => {
    const r = parse({ toAddress: '', amount: '0.1' })
    expect(r.success).toBe(false)
    const msg = r.error?.issues[0].message
    expect(msg).toContain('required')
  })

  it('fails for a random invalid string', () => {
    const r = parse({ toAddress: 'abc123', amount: '0.1' })
    expect(r.success).toBe(false)
    const msg = r.error?.issues[0].message
    expect(msg).toContain('Invalid TON address format')
  })
})

describe('sendSchema — amount', () => {
  it('passes for 0.01 TON (minimum)', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '0.01' })
    expect(r.success).toBe(true)
  })

  it('passes for a large amount', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '9999.99' })
    expect(r.success).toBe(true)
  })

  it('fails when amount is 0', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '0' })
    expect(r.success).toBe(false)
    const msg = r.error?.issues[0].message
    expect(msg).toContain('positive number')
  })

  it('fails when amount is negative', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '-1' })
    expect(r.success).toBe(false)
  })

  it('fails when amount is below minimum (0.001)', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '0.001' })
    expect(r.success).toBe(false)
    const msg = r.error?.issues[0].message
    expect(msg).toContain('Minimum amount')
  })

  it('fails when amount is not a number', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: 'abc' })
    expect(r.success).toBe(false)
  })

  it('fails when amount is empty', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '' })
    expect(r.success).toBe(false)
  })
})

describe('sendSchema — comment (optional)', () => {
  it('passes without comment', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '0.1' })
    expect(r.success).toBe(true)
  })

  it('passes with a short comment', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '0.1', comment: 'payment' })
    expect(r.success).toBe(true)
  })

  it('fails when comment exceeds 128 characters', () => {
    const r = parse({ toAddress: VALID_ADDRESS, amount: '0.1', comment: 'x'.repeat(129) })
    expect(r.success).toBe(false)
    const msg = r.error?.issues[0].message
    expect(msg).toContain('Comment too long')
  })
})
