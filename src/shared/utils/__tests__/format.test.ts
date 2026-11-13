import { describe, it, expect } from 'vitest';
import { truncateAddress } from '../format';

const ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

describe('truncateAddress', () => {
  it('TC_FORMAT_TRUNC_001 truncates a long address with default 6/6', () => {
    expect(truncateAddress(ADDRESS)).toBe('EQD4FP...Dp6_0t');
  });

  it('TC_FORMAT_TRUNC_002 returns a short address unchanged', () => {
    expect(truncateAddress('EQ1234')).toBe('EQ1234');
  });

  it('TC_FORMAT_TRUNC_003 returns an em dash for empty input', () => {
    expect(truncateAddress('')).toBe('—');
  });

  it('TC_FORMAT_TRUNC_004 honours custom prefix/suffix widths', () => {
    expect(truncateAddress(ADDRESS, 2, 3)).toBe('EQ..._0t');
  });

  it('TC_FORMAT_TRUNC_005 leaves an address exactly at the boundary unchanged', () => {
    const exact = 'A'.repeat(12);
    expect(truncateAddress(exact)).toBe(exact);
  });

  it('TC_FORMAT_TRUNC_006 truncates one char over the boundary', () => {
    const over = 'A'.repeat(13);
    expect(truncateAddress(over)).toBe('AAAAAA...AAAAAA');
  });
});
