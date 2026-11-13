import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('@ton/core', () => ({
  Address: {
    parse: vi.fn((addr: string) => {
      const t = addr.trim();
      if (t.length === 48 && /^(EQ|UQ|0Q|kQ)[A-Za-z0-9_-]{46}$/.test(t)) {
        return { toString: () => t };
      }
      throw new Error('Invalid address');
    }),
  },
}));

const mockSendTransaction = vi.fn();
vi.mock('@/shared/services/ton.service', () => ({
  tonService: { sendTransaction: (...args: unknown[]) => mockSendTransaction(...args) },
}));

import { useSend } from '../useSend';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

const OWN = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';
const OTHER = 'UQBvI0aFLnw2QbZgjMPCLRdtRHxhUyinQudg6sdiohIwg5jL';
const ZERO = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ';

beforeEach(() => {
  vi.clearAllMocks();
  mockSendTransaction.mockReset();
  useWalletStore.setState({
    address: OWN,
    publicKey: 'aa',
    mnemonic: Array(24).fill('word'),
    balance: null,
    error: null,
    isLoading: false,
    isEncrypted: false,
  });
});

describe('useSend validation', () => {
  it('TC_USESEND_VALIDATE_001 accepts a well-formed payload', () => {
    const { result } = renderHook(() => useSend());
    expect(result.current.validate({ toAddress: OTHER, amount: '0.5' }).success).toBe(true);
  });

  it('TC_USESEND_VALIDATE_002 rejects a malformed payload', () => {
    const { result } = renderHook(() => useSend());
    expect(result.current.validate({ toAddress: 'nope', amount: '0' }).success).toBe(false);
  });
});

describe('useSend address risk', () => {
  it('TC_USESEND_RISK_001 flags the zero address as suspicious', () => {
    const { result } = renderHook(() => useSend());
    let risk: ReturnType<typeof result.current.checkAddress>;
    act(() => {
      risk = result.current.checkAddress(ZERO);
    });
    expect(risk?.risk).toBe('suspicious');
    expect(result.current.addressRisk?.risk).toBe('suspicious');
  });

  it('TC_USESEND_RISK_002 flags sending to own address', () => {
    const { result } = renderHook(() => useSend());
    const risk = result.current.checkAddress(OWN);
    expect(risk?.risk).toBe('suspicious');
  });

  it('TC_USESEND_RISK_003 accepts a normal external address', () => {
    const { result } = renderHook(() => useSend());
    expect(result.current.checkAddress(OTHER)?.risk).toBe('safe');
  });

  it('TC_USESEND_RISK_004 ignores an empty address', () => {
    const { result } = renderHook(() => useSend());
    expect(result.current.checkAddress('')).toBeUndefined();
  });
});

describe('useSend flow', () => {
  it('TC_USESEND_FLOW_001 moves to confirming with pending data', () => {
    const { result } = renderHook(() => useSend());
    act(() => {
      result.current.requestSend({ toAddress: OTHER, amount: '0.5' });
    });
    expect(result.current.status).toBe('confirming');
    expect(result.current.pendingData).toEqual({ toAddress: OTHER, amount: '0.5' });
  });

  it('TC_USESEND_FLOW_002 does nothing without wallet credentials', async () => {
    useWalletStore.setState({ mnemonic: null, publicKey: null });
    const { result } = renderHook(() => useSend());
    act(() => {
      result.current.requestSend({ toAddress: OTHER, amount: '0.5' });
    });

    await act(async () => {
      await result.current.confirmSend();
    });

    expect(result.current.status).toBe('confirming');
    expect(mockSendTransaction).not.toHaveBeenCalled();
  });

  it('TC_USESEND_FLOW_003 sends and reaches success', async () => {
    mockSendTransaction.mockResolvedValue('7');
    const { result } = renderHook(() => useSend());
    act(() => {
      result.current.requestSend({ toAddress: OTHER, amount: '0.5' });
    });

    await act(async () => {
      await result.current.confirmSend();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.txId).toBe('7');
    expect(mockSendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ toAddress: OTHER, amount: '0.5' })
    );
  });

  it('TC_USESEND_FLOW_004 reports a send failure', async () => {
    mockSendTransaction.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useSend());
    act(() => {
      result.current.requestSend({ toAddress: OTHER, amount: '0.5' });
    });

    await act(async () => {
      await result.current.confirmSend();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('network down');
  });

  it('TC_USESEND_FLOW_005 cancel returns to idle', () => {
    const { result } = renderHook(() => useSend());
    act(() => {
      result.current.requestSend({ toAddress: OTHER, amount: '0.5' });
      result.current.cancelSend();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.pendingData).toBeNull();
    expect(result.current.addressRisk).toBeNull();
  });

  it('TC_USESEND_FLOW_006 reset clears success state', async () => {
    mockSendTransaction.mockResolvedValue('7');
    const { result } = renderHook(() => useSend());
    act(() => {
      result.current.requestSend({ toAddress: OTHER, amount: '0.5' });
    });
    await act(async () => {
      await result.current.confirmSend();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.txId).toBeNull();
    expect(result.current.pendingData).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
