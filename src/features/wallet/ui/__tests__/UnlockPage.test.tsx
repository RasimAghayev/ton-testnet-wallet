import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockNavigate = vi.fn();
let mockState: { from?: string } | null = null;
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockState }),
  };
});

const mocks = vi.hoisted(() => ({
  loadWallet: vi.fn(),
  clearWallet: vi.fn(),
  isEncrypted: vi.fn(),
  saveWallet: vi.fn(),
}));

vi.mock('@/shared/services/storage.service', () => ({
  storageService: {
    loadWallet: mocks.loadWallet,
    clearWallet: mocks.clearWallet,
    isEncrypted: mocks.isEncrypted,
    saveWallet: mocks.saveWallet,
  },
}));

import { UnlockPage } from '../UnlockPage';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

const WALLET = {
  address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  publicKey: 'abc',
  mnemonic: Array(24).fill('word') as string[],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  mockState = null;
  mocks.loadWallet.mockReset();
  mocks.clearWallet.mockReturnValue(undefined);
  mocks.isEncrypted.mockResolvedValue(true);
  useWalletStore.setState({
    address: null,
    publicKey: null,
    mnemonic: null,
    balance: null,
    error: null,
    isLoading: false,
    isEncrypted: true,
  });
});

describe('UnlockPage', () => {
  it('TC_UNLOCK_001 renders the unlock form when the wallet is encrypted', () => {
    render(<UnlockPage />);
    expect(screen.getByText('Wallet Encrypted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unlock Wallet/ })).toBeInTheDocument();
  });

  it('TC_UNLOCK_002 keeps the submit button disabled until a password is typed', () => {
    render(<UnlockPage />);
    expect(screen.getByRole('button', { name: /Unlock Wallet/ })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'pw' },
    });
    expect(screen.getByRole('button', { name: /Unlock Wallet/ })).not.toBeDisabled();
  });

  it('TC_UNLOCK_003 shows an error for an incorrect password', async () => {
    mocks.loadWallet.mockResolvedValue(null);
    render(<UnlockPage />);

    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Unlock Wallet/ }));

    await waitFor(() => expect(screen.getByText('Invalid password')).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('TC_UNLOCK_004 unlocks and navigates to the originating route', async () => {
    mocks.loadWallet.mockResolvedValue(WALLET);
    mockState = { from: '/send' };
    render(<UnlockPage />);

    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'correct' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Unlock Wallet/ }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/send', { replace: true }));
  });

  it('TC_UNLOCK_005 defaults the destination to the dashboard', async () => {
    mocks.loadWallet.mockResolvedValue(WALLET);
    render(<UnlockPage />);

    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'correct' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Unlock Wallet/ }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });

  it('TC_UNLOCK_006 toggles password visibility', () => {
    render(<UnlockPage />);
    const input = screen.getByPlaceholderText('Enter your password');
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByText('Show password'));

    expect(input).toHaveAttribute('type', 'text');
  });

  it('TC_UNLOCK_007 reset clears the wallet after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<UnlockPage />);

    fireEvent.click(screen.getByRole('button', { name: /Forgot password/ }));

    expect(mocks.clearWallet).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/setup', { replace: true });
  });

  it('TC_UNLOCK_008 reset does nothing when cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<UnlockPage />);

    fireEvent.click(screen.getByRole('button', { name: /Forgot password/ }));

    expect(mocks.clearWallet).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('TC_UNLOCK_009 renders nothing once an unencrypted wallet is active', () => {
    useWalletStore.setState({ address: WALLET.address, isEncrypted: false });
    const { container } = render(<UnlockPage />);
    expect(container).toBeEmptyDOMElement();
  });
});
