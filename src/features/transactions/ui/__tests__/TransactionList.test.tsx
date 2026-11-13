import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Transaction } from '@/shared/types/transaction';

const mocks = vi.hoisted(() => ({
  transactions: [] as Transaction[],
  isLoading: false,
  error: null as string | null,
  query: '',
  setQuery: vi.fn(),
  reload: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../hooks/useTransactions', () => ({
  useTransactions: () => mocks,
}));

import { TransactionList } from '../TransactionList';

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
  mockNavigate.mockReset();
  mocks.transactions = [];
  mocks.isLoading = false;
  mocks.error = null;
  mocks.query = '';
});

describe('TransactionList', () => {
  it('TC_TXLIST_001 shows an empty state when there are no transactions', () => {
    render(<TransactionList />);
    expect(screen.getByText('No transactions yet.')).toBeInTheDocument();
  });

  it('TC_TXLIST_002 distinguishes an empty search result', () => {
    mocks.query = 'zzz';
    render(<TransactionList />);
    expect(screen.getByText('No transactions match your search.')).toBeInTheDocument();
  });

  it('TC_TXLIST_003 shows a spinner while loading', () => {
    mocks.isLoading = true;
    render(<TransactionList />);
    expect(screen.queryByText('No transactions yet.')).not.toBeInTheDocument();
    expect(screen.queryByText('Transactions')).toBeInTheDocument();
  });

  it('TC_TXLIST_004 shows an error with a retry action', () => {
    mocks.error = 'Failed to load transactions.';
    render(<TransactionList />);

    expect(screen.getByText('Failed to load transactions.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mocks.reload).toHaveBeenCalledTimes(1);
  });

  it('TC_TXLIST_005 renders one row per transaction', () => {
    mocks.transactions = TXS;
    render(<TransactionList />);
    expect(screen.getByText(/^From:/)).toBeInTheDocument();
    expect(screen.getByText(/^To:/)).toBeInTheDocument();
    expect(screen.getByText('+1.5000 TON')).toBeInTheDocument();
    expect(screen.getByText('-0.2500 TON')).toBeInTheDocument();
  });

  it('TC_TXLIST_006 forwards search input changes', () => {
    mocks.transactions = TXS;
    render(<TransactionList />);
    fireEvent.change(screen.getByPlaceholderText('Search by address or amount...'), {
      target: { value: '1.5' },
    });
    expect(mocks.setQuery).toHaveBeenCalledWith('1.5');
  });

  it('TC_TXLIST_007 navigates back to the dashboard', () => {
    render(<TransactionList />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
