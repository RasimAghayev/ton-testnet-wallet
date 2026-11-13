import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mnemonicToPrivateKey: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@ton/crypto', () => ({
  mnemonicToPrivateKey: mocks.mnemonicToPrivateKey,
}));

vi.mock('@ton/ton', () => {
  class WalletContractV4 {
    static create = mocks.create;
    address: unknown;
    constructor(args: { address?: unknown }) {
      this.address = args.address;
    }
  }
  class TonClient {
    constructor(readonly opts: unknown) {}
  }
  return { WalletContractV4, TonClient };
});

import { walletService } from '../wallet.service';

const PUBLIC_KEY_HEX = '03e6c5614b81f30c926a73a7e9fd67631073a05f585dfc91c577c9795bbaa9cd';

beforeEach(() => {
  mocks.mnemonicToPrivateKey.mockReset();
  mocks.create.mockReset();
});

describe('walletService.getContract', () => {
  it('TC_WALLETSVC_CONTRACT_001 builds a WalletContractV4 for the public key', () => {
    const contract = { address: { toString: () => 'ADDR' } };
    mocks.create.mockReturnValue(contract);

    const result = walletService.getContract(PUBLIC_KEY_HEX);

    expect(result).toBe(contract);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    const arg = mocks.create.mock.calls[0][0] as {
      workchain: number;
      publicKey: Buffer;
    };
    expect(arg.workchain).toBe(0);
    expect(Buffer.from(arg.publicKey).toString('hex')).toBe(PUBLIC_KEY_HEX);
  });
});

describe('walletService.importWallet wiring', () => {
  it('TC_WALLETSVC_IMPORT_004 derives the key pair and passes it to the contract', async () => {
    const publicKey = new Uint8Array(32).fill(7);
    mocks.mnemonicToPrivateKey.mockResolvedValue({ publicKey });
    mocks.create.mockReturnValue({ address: { toString: () => 'ADDR' } });

    const wallet = await walletService.importWallet(['a', 'b', 'c']);

    expect(mocks.mnemonicToPrivateKey).toHaveBeenCalledWith(['a', 'b', 'c']);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(wallet.publicKey).toBe(Buffer.from(publicKey).toString('hex'));
  });
});
