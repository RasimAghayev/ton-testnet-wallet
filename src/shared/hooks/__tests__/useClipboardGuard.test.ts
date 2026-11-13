import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('@ton/core', () => ({
  Address: {
    parse: vi.fn((addr: string) => {
      const t = addr.trim();
      if (t.length === 48 && /^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(t)) {
        return { toString: () => t };
      }
      throw new Error('Invalid address');
    }),
  },
}));

import { useClipboardGuard } from '../useClipboardGuard';

const VALID = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

function pasteEvent(value: string) {
  return {
    clipboardData: { getData: () => value },
  } as unknown as React.ClipboardEvent<HTMLInputElement>;
}

describe('useClipboardGuard', () => {
  it('TC_CLIPGUARD_001 reports a safe paste and forwards the trimmed value', () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useClipboardGuard(onResult));

    act(() => {
      result.current.onPaste(pasteEvent(`  ${VALID}  `));
    });

    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ risk: 'safe' }), VALID);
  });

  it('TC_CLIPGUARD_002 reports an invalid paste', () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useClipboardGuard(onResult));

    act(() => {
      result.current.onPaste(pasteEvent('garbage'));
    });

    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ risk: 'invalid' }), 'garbage');
  });

  it('TC_CLIPGUARD_003 returns a stable callback identity', () => {
    const onResult = vi.fn();
    const { result, rerender } = renderHook(() => useClipboardGuard(onResult));
    const first = result.current.onPaste;
    rerender();
    expect(result.current.onPaste).toBe(first);
  });
});
