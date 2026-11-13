import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mocks = vi.hoisted(() => ({
  createWallet: vi.fn(),
  importWallet: vi.fn(),
  saveWallet: vi.fn(),
  loadWallet: vi.fn(),
  clearWallet: vi.fn(),
  isEncrypted: vi.fn(),
}));

vi.mock('@/shared/services/wallet.service', () => ({
  walletService: { createWallet: mocks.createWallet, importWallet: mocks.importWallet },
}));

vi.mock('@/shared/services/storage.service', () => ({
  storageService: {
    saveWallet: mocks.saveWallet,
    loadWallet: mocks.loadWallet,
    clearWallet: mocks.clearWallet,
    isEncrypted: mocks.isEncrypted,
  },
}));

import { SetupPage } from '../SetupPage';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

const WALLET = {
  address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  publicKey: 'abc',
  mnemonic: Array.from({ length: 24 }, (_, i) => `word${i}`),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  mocks.saveWallet.mockResolvedValue(undefined);
  mocks.loadWallet.mockResolvedValue(null);
  mocks.clearWallet.mockReturnValue(undefined);
  mocks.isEncrypted.mockResolvedValue(false);
  useWalletStore.setState({
    address: null,
    publicKey: null,
    mnemonic: null,
    balance: null,
    error: null,
    isLoading: false,
    isEncrypted: false,
  });
});

describe('SetupPage tabs', () => {
  it('TC_SETUP_PAGE_001 opens on the create tab', () => {
    render(<SetupPage />);
    expect(screen.getByText('Create new wallet')).toBeInTheDocument();
    expect(screen.queryByText('Import existing wallet')).not.toBeInTheDocument();
  });

  it('TC_SETUP_PAGE_002 switches to the import tab', () => {
    render(<SetupPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Import Wallet' }));
    expect(screen.getByText('Import existing wallet')).toBeInTheDocument();
    expect(screen.queryByText('Create new wallet')).not.toBeInTheDocument();
  });
});

describe('CreateWallet flow', () => {
  it('TC_SETUP_PAGE_003 generates a wallet and shows the 24-word phrase', async () => {
    mocks.createWallet.mockResolvedValue(WALLET);
    render(<SetupPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Wallet' }));

    expect(await screen.findByText('Save your recovery phrase')).toBeInTheDocument();
    expect(screen.getAllByText(/word\d+/)).toHaveLength(24);
    expect(screen.getByRole('button', { name: /I have saved my phrase/ })).toBeInTheDocument();
  });

  it('TC_SETUP_PAGE_004 shows an error when generation fails', async () => {
    mocks.createWallet.mockRejectedValue(new Error('no entropy'));
    render(<SetupPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Wallet' }));

    expect(
      await screen.findByText('Failed to create wallet. Please try again.')
    ).toBeInTheDocument();
  });

  it('TC_SETUP_PAGE_005 requires a strong password before generating when encryption is on', async () => {
    render(<SetupPage />);
    fireEvent.click(screen.getByLabelText('Encrypt wallet with password (recommended)'));

    const generate = screen.getByRole('button', { name: 'Generate Wallet' });
    expect(generate).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/Min 12 chars/), {
      target: { value: 'StrongPassword123!' }, // i-dont-think-this-is-a-secret
    });
    expect(screen.getByRole('button', { name: 'Generate Wallet' })).not.toBeDisabled();
  });
});

describe('ImportWallet flow', () => {
  it('TC_SETUP_PAGE_006 keeps the import button disabled below 24 words', () => {
    render(<SetupPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Import Wallet' }));

    const textarea = screen.getByPlaceholderText('word1 word2 word3 ...');
    fireEvent.change(textarea, { target: { value: Array(23).fill('word').join(' ') } });

    expect(screen.getByText('23 / 24 words')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import Wallet' })).toBeDisabled();
  });

  it('TC_SETUP_PAGE_007 enables the import button at exactly 24 words', () => {
    render(<SetupPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Import Wallet' }));

    const textarea = screen.getByPlaceholderText('word1 word2 word3 ...');
    fireEvent.change(textarea, { target: { value: Array(24).fill('word').join(' ') } });

    expect(screen.getByText('24 / 24 words')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import Wallet' })).not.toBeDisabled();
  });

  it('TC_SETUP_PAGE_008 imports and navigates to the dashboard', async () => {
    mocks.importWallet.mockResolvedValue(WALLET);
    render(<SetupPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Import Wallet' }));

    fireEvent.change(screen.getByPlaceholderText('word1 word2 word3 ...'), {
      target: { value: Array(24).fill('word').join(' ') },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import Wallet' }));

    await vi.waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('TC_SETUP_PAGE_009 shows an import error', async () => {
    mocks.importWallet.mockRejectedValue(new Error('Invalid mnemonic phrase.'));
    render(<SetupPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Import Wallet' }));

    fireEvent.change(screen.getByPlaceholderText('word1 word2 word3 ...'), {
      target: { value: Array(24).fill('word').join(' ') },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import Wallet' }));

    expect(await screen.findByText('Invalid mnemonic phrase.')).toBeInTheDocument();
  });
});
