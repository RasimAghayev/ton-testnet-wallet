import { describe, it, expect, vi } from 'vitest';

vi.mock('@ton/core', () => ({
  Address: {
    parse: vi.fn((addr: string) => {
      const t = addr.trim();
      if (t.length === 48 && /^(EQ|UQ|0Q|kQ)[A-Za-z0-9_-]{46}$/.test(t)) return {};
      throw new Error('Invalid address');
    }),
  },
}));

import { sendSchema } from '../validation';

const VALID = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

function parse(data: Record<string, unknown>) {
  return sendSchema.safeParse(data);
}

describe('sendSchema amount boundaries', () => {
  it('TC_SCHEMA_AMT_001 accepts the exact minimum 0.01', () => {
    expect(parse({ toAddress: VALID, amount: '0.01' }).success).toBe(true);
  });

  it('TC_SCHEMA_AMT_002 rejects just below the minimum', () => {
    const r = parse({ toAddress: VALID, amount: '0.0099' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain('Minimum amount');
  });

  it('TC_SCHEMA_AMT_003 accepts scientific notation', () => {
    expect(parse({ toAddress: VALID, amount: '1e3' }).success).toBe(true);
  });

  it('TC_SCHEMA_AMT_004 accepts surrounding whitespace', () => {
    expect(parse({ toAddress: VALID, amount: ' 0.5 ' }).success).toBe(true);
  });

  it('TC_SCHEMA_AMT_005 rejects a hex literal (parseFloat reads 0)', () => {
    const r = parse({ toAddress: VALID, amount: '0x10' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain('positive number');
  });

  it('TC_SCHEMA_AMT_006 rejects NaN', () => {
    expect(parse({ toAddress: VALID, amount: 'NaN' }).success).toBe(false);
  });

  it('TC_SCHEMA_AMT_007 rejects a negative amount', () => {
    expect(parse({ toAddress: VALID, amount: '-0.5' }).success).toBe(false);
  });
});

describe('sendSchema address validation', () => {
  it('TC_SCHEMA_ADDR_001 accepts a padded valid address', () => {
    expect(parse({ toAddress: `  ${VALID}  `, amount: '0.5' }).success).toBe(true);
  });

  it('TC_SCHEMA_ADDR_002 rejects a whitespace-only address', () => {
    const r = parse({ toAddress: '   ', amount: '0.5' });
    expect(r.success).toBe(false);
  });

  it('TC_SCHEMA_ADDR_003 rejects an address with illegal characters', () => {
    const r = parse({ toAddress: 'EQ' + '!'.repeat(46), amount: '0.5' });
    expect(r.success).toBe(false);
  });
});

describe('sendSchema comment boundaries', () => {
  it('TC_SCHEMA_COMMENT_001 accepts exactly 128 characters', () => {
    expect(parse({ toAddress: VALID, amount: '0.5', comment: 'x'.repeat(128) }).success).toBe(true);
  });

  it('TC_SCHEMA_COMMENT_002 rejects 129 characters', () => {
    const r = parse({ toAddress: VALID, amount: '0.5', comment: 'x'.repeat(129) });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain('Comment too long');
  });

  it('TC_SCHEMA_COMMENT_003 accepts an empty comment string', () => {
    expect(parse({ toAddress: VALID, amount: '0.5', comment: '' }).success).toBe(true);
  });
});

describe('sendSchema required fields', () => {
  it('TC_SCHEMA_REQ_001 rejects a missing amount', () => {
    const r = parse({ toAddress: VALID });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some(i => i.path[0] === 'amount')).toBe(true);
  });

  it('TC_SCHEMA_REQ_002 rejects a missing address', () => {
    const r = parse({ amount: '0.5' });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some(i => i.path[0] === 'toAddress')).toBe(true);
  });
});
