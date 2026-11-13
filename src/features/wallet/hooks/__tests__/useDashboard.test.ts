import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const mockGetBalance = vi.fn();
vi.mock('@/shared/services/ton.service', () => ({
  tonService: { getBalance: (...args: unknown[]) => mockGetBalance(...args) },
}));

import { useDashboard } from '../useDashboard';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

const ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetBalance.mockReset();
  useWalletStore.setState({ address: ADDRESS, balance: null, error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDashboard', () => {
  it('TC_USEDASH_001 fetches the balance on mount and stores it', async () => {
    mockGetBalance.mockResolvedValue('2.5');
    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetBalance).toHaveBeenCalledWith(ADDRESS);
    expect(useWalletStore.getState().balance).toBe('2.5');
    expect(result.current.balance).toBe('2.5');
  });

  it('TC_USEDASH_002 surfaces a balance fetch failure', async () => {
    mockGetBalance.mockRejectedValue(new Error('rpc'));
    renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useWalletStore.getState().error).toBe('Failed to fetch balance.');
  });

  it('TC_USEDASH_003 does not fetch without an address', async () => {
    useWalletStore.setState({ address: null });
    renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetBalance).not.toHaveBeenCalled();
  });

  it('TC_USEDASH_004 refreshes on the configured interval', async () => {
    vi.useFakeTimers();
    mockGetBalance.mockResolvedValue('1');
    renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockGetBalance).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    expect(mockGetBalance).toHaveBeenCalledTimes(2);
  });

  it('TC_USEDASH_005 clears the interval on unmount', async () => {
    vi.useFakeTimers();
    mockGetBalance.mockResolvedValue('1');
    const { unmount } = renderHook(() => useDashboard());

    await act(async () => {
      await Promise.resolve();
    });
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  it('TC_USEDASH_006 exposes an imperative refresh', async () => {
    mockGetBalance.mockResolvedValue('3');
    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.refresh();
    });

    expect(useWalletStore.getState().balance).toBe('3');
  });
});
