import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const mockGetTransactions = vi.fn();
vi.mock('@/shared/services/ton.service', () => ({
  tonService: { getTransactions: (...args: unknown[]) => mockGetTransactions(...args) },
}));

import { useTransactions } from '../useTransactions';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';
import type { Transaction } from '@/shared/types/transaction';

const ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

const TXS: Transaction[] = [
  {
    hash: 'aaa111',
    type: 'in',
    amount: '1.5000',
    address: 'UQBvI0aFLnw2QbZgjMPCLRdtRHxhUyinQudg6sdiohIwg5jL',
    timestamp: 1_700_000_000,
    fee: '0.005',
  },
  {
    hash: 'bbb222',
    type: 'out',
    amount: '0.2500',
    address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
    timestamp: 1_700_000_100,
    fee: '0.004',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTransactions.mockReset();
  mockGetTransactions.mockResolvedValue(TXS);
  useWalletStore.setState({ address: ADDRESS });
});

describe('useTransactions loading', () => {
  it('TC_USETX_LOAD_001 loads transactions for the current address', async () => {
    const { result } = renderHook(() => useTransactions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetTransactions).toHaveBeenCalledWith(ADDRESS);
    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('TC_USETX_LOAD_002 reports a load failure', async () => {
    mockGetTransactions.mockRejectedValue(new Error('rpc down'));
    const { result } = renderHook(() => useTransactions());

    await waitFor(() => expect(result.current.error).toBe('Failed to load transactions.'));
    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('TC_USETX_LOAD_003 does not fetch without an address', async () => {
    useWalletStore.setState({ address: null });
    const { result } = renderHook(() => useTransactions());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetTransactions).not.toHaveBeenCalled();
    expect(result.current.transactions).toHaveLength(0);
  });

  it('TC_USETX_LOAD_004 reload re-fetches', async () => {
    const { result } = renderHook(() => useTransactions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockGetTransactions.mockResolvedValue([TXS[0]]);
    await act(async () => {
      await result.current.reload();
    });

    expect(mockGetTransactions).toHaveBeenCalledTimes(2);
    expect(result.current.transactions).toHaveLength(1);
  });
});

describe('useTransactions filtering', () => {
  it('TC_USETX_FILTER_001 filters by address substring', async () => {
    const { result } = renderHook(() => useTransactions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setQuery('UQBvI0aF'));

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].hash).toBe('aaa111');
  });

  it('TC_USETX_FILTER_002 filters by amount substring', async () => {
    const { result } = renderHook(() => useTransactions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setQuery('0.25'));

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].hash).toBe('bbb222');
  });

  it('TC_USETX_FILTER_003 filters by hash case-insensitively', async () => {
    const { result } = renderHook(() => useTransactions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setQuery('BBB'));

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].hash).toBe('bbb222');
  });

  it('TC_USETX_FILTER_004 returns no rows for a query with no match', async () => {
    const { result } = renderHook(() => useTransactions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setQuery('zzzz'));

    expect(result.current.transactions).toHaveLength(0);
  });

  it('TC_USETX_FILTER_005 trims whitespace-only query to all rows', async () => {
    const { result } = renderHook(() => useTransactions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setQuery('   '));

    expect(result.current.transactions).toHaveLength(2);
  });
});
