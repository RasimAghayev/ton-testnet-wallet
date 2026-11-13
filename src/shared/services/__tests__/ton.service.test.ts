import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  getClient: vi.fn(),
  getContract: vi.fn(),
  fromNano: vi.fn((v: bigint | number) => String(v)),
  toNano: vi.fn((v: string) => `${v}nano`),
  internal: vi.fn((args: unknown) => ({ __internal: args })),
  parse: vi.fn((a: string) => ({ __addr: a, toString: () => a })),
  mnemonicToPrivateKey: vi.fn(),
}));

vi.mock('@ton/ton', () => ({
  internal: mocks.internal,
  fromNano: mocks.fromNano,
  toNano: mocks.toNano,
  SendMode: { PAY_GAS_SEPARATELY: 1, IGNORE_ERRORS: 2 },
}));

vi.mock('@ton/crypto', () => ({
  mnemonicToPrivateKey: mocks.mnemonicToPrivateKey,
}));

vi.mock('@ton/core', () => ({
  Address: { parse: mocks.parse },
}));

vi.mock('../wallet.service', () => ({
  walletService: { getClient: mocks.getClient, getContract: mocks.getContract },
}));

import { tonService } from '../ton.service';

const ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

type FakeMsg = {
  info: {
    type: 'internal';
    value: { coins: bigint };
    src?: { toString: (opts?: unknown) => string };
    dest?: { toString: (opts?: unknown) => string };
  };
};

function internalMsg(coins: bigint, side: 'src' | 'dest'): FakeMsg {
  const addr = { toString: () => (side === 'src' ? 'SRC' : 'DEST') };
  return {
    info: {
      type: 'internal',
      value: { coins },
      ...(side === 'src' ? { src: addr } : { dest: addr }),
    },
  };
}

function makeTx(opts: {
  outMessages: FakeMsg[];
  inMessage: FakeMsg | null;
  now?: number;
  hash?: string;
  fees?: bigint;
}) {
  return {
    outMessages: {
      size: opts.outMessages.length,
      get: (i: number) => opts.outMessages[i],
    },
    inMessage: opts.inMessage,
    now: opts.now ?? 1_700_000_000,
    hash: () => ({ toString: () => opts.hash ?? 'deadbeef' }),
    totalFees: { coins: opts.fees ?? 100n },
  };
}

beforeEach(() => {
  mocks.getClient.mockReset();
  mocks.getContract.mockReset();
  mocks.fromNano.mockClear();
  mocks.toNano.mockClear();
  mocks.internal.mockClear();
  mocks.parse.mockClear();
  mocks.mnemonicToPrivateKey.mockReset();
  mocks.fromNano.mockImplementation((v: bigint | number) => String(v));
  mocks.toNano.mockImplementation((v: string) => `${v}nano`);
  mocks.internal.mockImplementation((args: unknown) => ({ __internal: args }));
  mocks.parse.mockImplementation((a: string) => ({ __addr: a, toString: () => a }));
});

describe('tonService.getBalance', () => {
  it('TC_TONSVC_BALANCE_001 returns the fromNano-formatted balance', async () => {
    const getBalance = vi.fn().mockResolvedValue(1_500_000_000n);
    mocks.getClient.mockReturnValue({ getBalance });
    mocks.fromNano.mockReturnValue('1.5');

    await expect(tonService.getBalance(ADDRESS)).resolves.toBe('1.5');
    expect(mocks.parse).toHaveBeenCalledWith(ADDRESS);
    expect(getBalance).toHaveBeenCalledWith(expect.objectContaining({ __addr: ADDRESS }));
  });

  it('TC_TONSVC_BALANCE_002 rejects an invalid address', async () => {
    mocks.getClient.mockReturnValue({ getBalance: vi.fn() });
    mocks.parse.mockImplementation(() => {
      throw new Error('Invalid address');
    });

    await expect(tonService.getBalance('nope')).rejects.toThrow('Invalid address');
  });

  it('TC_TONSVC_BALANCE_003 propagates RPC errors', async () => {
    mocks.getClient.mockReturnValue({
      getBalance: vi.fn().mockRejectedValue(new Error('RPC down')),
    });

    await expect(tonService.getBalance(ADDRESS)).rejects.toThrow('RPC down');
  });
});

describe('tonService.getTransactions', () => {
  it('TC_TONSVC_TXS_001 maps an outgoing transaction', async () => {
    const tx = makeTx({
      outMessages: [internalMsg(2_000_000n, 'dest')],
      inMessage: null,
      hash: 'aabb',
      now: 1_700_000_123,
      fees: 5_000n,
    });
    mocks.getClient.mockReturnValue({ getTransactions: vi.fn().mockResolvedValue([tx]) });

    const result = await tonService.getTransactions(ADDRESS);

    expect(result).toEqual([
      {
        hash: 'aabb',
        type: 'out',
        amount: '2000000',
        address: 'DEST',
        timestamp: 1_700_000_123,
        fee: '5000',
      },
    ]);
  });

  it('TC_TONSVC_TXS_002 maps an incoming transaction', async () => {
    const tx = makeTx({
      outMessages: [],
      inMessage: internalMsg(9_000n, 'src'),
      hash: 'ccdd',
      now: 1_700_000_456,
      fees: 100n,
    });
    mocks.getClient.mockReturnValue({ getTransactions: vi.fn().mockResolvedValue([tx]) });

    const result = await tonService.getTransactions(ADDRESS);

    expect(result[0]).toMatchObject({
      hash: 'ccdd',
      type: 'in',
      amount: '9000',
      address: 'SRC',
      timestamp: 1_700_000_456,
    });
  });

  it('TC_TONSVC_TXS_003 handles a transaction with no internal messages', async () => {
    const tx = makeTx({ outMessages: [], inMessage: null, hash: 'ee' });
    mocks.getClient.mockReturnValue({ getTransactions: vi.fn().mockResolvedValue([tx]) });

    const result = await tonService.getTransactions(ADDRESS);

    expect(result[0]).toMatchObject({ type: 'in', amount: '0', address: '' });
  });

  it('TC_TONSVC_TXS_004 uses TX_FETCH_LIMIT when fetching', async () => {
    const getTransactions = vi.fn().mockResolvedValue([]);
    mocks.getClient.mockReturnValue({ getTransactions });

    await tonService.getTransactions(ADDRESS);

    expect(getTransactions).toHaveBeenCalledWith(expect.anything(), { limit: 20 });
  });

  it('TC_TONSVC_TXS_005 propagates RPC errors', async () => {
    mocks.getClient.mockReturnValue({
      getTransactions: vi.fn().mockRejectedValue(new Error('RPC down')),
    });

    await expect(tonService.getTransactions(ADDRESS)).rejects.toThrow('RPC down');
  });
});

describe('tonService.sendTransaction', () => {
  it('TC_TONSVC_SEND_001 signs and sends a transfer, returning the seqno', async () => {
    const sendTransfer = vi.fn().mockResolvedValue(undefined);
    const getSeqno = vi.fn().mockResolvedValue(42);
    mocks.getClient.mockReturnValue({ open: vi.fn().mockReturnValue({ getSeqno, sendTransfer }) });
    mocks.getContract.mockReturnValue({ address: 'contract' });
    mocks.mnemonicToPrivateKey.mockResolvedValue({ secretKey: new Uint8Array(64) });

    const seq = await tonService.sendTransaction({
      mnemonic: Array(24).fill('word'),
      publicKeyHex: 'aa',
      toAddress: ADDRESS,
      amount: '0.5',
      comment: 'hi',
    });

    expect(seq).toBe('42');
    expect(getSeqno).toHaveBeenCalled();
    expect(sendTransfer).toHaveBeenCalledTimes(1);
    const transfer = sendTransfer.mock.calls[0][0] as {
      secretKey: Uint8Array;
      seqno: number;
      messages: unknown[];
    };
    expect(transfer.seqno).toBe(42);
    expect(transfer.secretKey).toHaveLength(64);
    expect(transfer.messages).toHaveLength(1);
    expect(mocks.internal).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.objectContaining({ __addr: ADDRESS }),
        bounce: false,
        body: 'hi',
      })
    );
  });

  it('TC_TONSVC_SEND_002 omits the comment body when no comment is given', async () => {
    const sendTransfer = vi.fn().mockResolvedValue(undefined);
    mocks.getClient.mockReturnValue({
      open: vi.fn().mockReturnValue({ getSeqno: vi.fn().mockResolvedValue(1), sendTransfer }),
    });
    mocks.getContract.mockReturnValue({});
    mocks.mnemonicToPrivateKey.mockResolvedValue({ secretKey: new Uint8Array(64) });

    await tonService.sendTransaction({
      mnemonic: Array(24).fill('word'),
      publicKeyHex: 'aa',
      toAddress: ADDRESS,
      amount: '0.5',
    });

    expect(mocks.internal).toHaveBeenCalledWith(expect.objectContaining({ body: '' }));
  });

  it('TC_TONSVC_SEND_003 propagates signing errors', async () => {
    mocks.getClient.mockReturnValue({ open: vi.fn().mockReturnValue({ getSeqno: vi.fn() }) });
    mocks.getContract.mockReturnValue({});
    mocks.mnemonicToPrivateKey.mockRejectedValue(new Error('bad mnemonic'));

    await expect(
      tonService.sendTransaction({
        mnemonic: ['bad'],
        publicKeyHex: 'aa',
        toAddress: ADDRESS,
        amount: '0.5',
      })
    ).rejects.toThrow('bad mnemonic');
  });
});
