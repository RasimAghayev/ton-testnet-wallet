import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Provide a full in-memory localStorage — same stub as storage.service.test.ts,
// needed here because clearWallet()/setWallet() go through storageService.
const makeLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
  };
};
vi.stubGlobal('localStorage', makeLocalStorage());

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockGetBalance = vi.fn();
vi.mock('@/shared/services/ton.service', () => ({
  tonService: { getBalance: (...args: unknown[]) => mockGetBalance(...args) },
}));

import { Dashboard } from '../Dashboard';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

const ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

beforeEach(() => {
  mockNavigate.mockClear();
  mockGetBalance.mockReset();
  useWalletStore.setState({ address: ADDRESS, balance: null, error: null });
});

afterEach(() => {
  useWalletStore.setState({
    address: null,
    publicKey: null,
    mnemonic: null,
    balance: null,
    error: null,
  });
});

describe('Dashboard', () => {
  it('shows a loading state before the balance resolves, then renders it', async () => {
    mockGetBalance.mockResolvedValue('12.5');
    render(<Dashboard />);

    expect(screen.queryByText('12.5000')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('12.5000')).toBeInTheDocument());
    expect(screen.getByText('TON')).toBeInTheDocument();
  });

  it('renders the truncated wallet address', async () => {
    mockGetBalance.mockResolvedValue('1');
    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('EQD4FP...Dp6_0t')).toBeInTheDocument());
  });

  it('shows the testnet faucet link when the balance is zero', async () => {
    mockGetBalance.mockResolvedValue('0');
    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('Get test TON')).toBeInTheDocument());
  });

  it('hides the testnet faucet link once the balance is positive', async () => {
    mockGetBalance.mockResolvedValue('5');
    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('5.0000')).toBeInTheDocument());
    expect(screen.queryByText('Get test TON')).not.toBeInTheDocument();
  });

  it('navigates to /send when Send is clicked', async () => {
    mockGetBalance.mockResolvedValue('1');
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('1.0000')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '↑ Send' }));
    expect(mockNavigate).toHaveBeenCalledWith('/send');
  });

  it('navigates to /receive when Receive is clicked', async () => {
    mockGetBalance.mockResolvedValue('1');
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('1.0000')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '↓ Receive' }));
    expect(mockNavigate).toHaveBeenCalledWith('/receive');
  });

  it('navigates to /transactions when the history shortcut is clicked', async () => {
    mockGetBalance.mockResolvedValue('1');
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('1.0000')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Transaction History'));
    expect(mockNavigate).toHaveBeenCalledWith('/transactions');
  });

  it('clears the wallet and navigates to /setup on confirmed disconnect', async () => {
    mockGetBalance.mockResolvedValue('1');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('1.0000')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Disconnect'));

    expect(useWalletStore.getState().address).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/setup');
  });

  it('keeps the wallet when disconnect is not confirmed', async () => {
    mockGetBalance.mockResolvedValue('1');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('1.0000')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Disconnect'));

    expect(useWalletStore.getState().address).toBe(ADDRESS);
    expect(mockNavigate).not.toHaveBeenCalledWith('/setup');
  });
});
