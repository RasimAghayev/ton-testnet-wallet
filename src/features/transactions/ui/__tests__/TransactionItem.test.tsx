import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionItem } from '../TransactionItem';
import type { Transaction } from '@/shared/types/transaction';

const IN_TX: Transaction = {
  hash: 'aaa111',
  type: 'in',
  amount: '1.5000',
  address: 'UQBvI0aFLnw2QbZgjMPCLRdtRHxhUyinQudg6sdiohIwg5jL',
  timestamp: 1_700_000_000,
  fee: '0.005',
};

const OUT_TX: Transaction = {
  hash: 'bbb222',
  type: 'out',
  amount: '0.2500',
  address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  timestamp: 1_700_000_100,
  fee: '0.004',
};

describe('TransactionItem', () => {
  it('TC_TXITEM_001 renders an incoming transaction with a plus amount', () => {
    render(<TransactionItem tx={IN_TX} />);
    expect(screen.getByText(/^From:/)).toBeInTheDocument();
    expect(screen.getByText('+1.5000 TON')).toBeInTheDocument();
    expect(screen.getByText('fee 0.005')).toBeInTheDocument();
  });

  it('TC_TXITEM_002 renders an outgoing transaction with a minus amount', () => {
    render(<TransactionItem tx={OUT_TX} />);
    expect(screen.getByText(/^To:/)).toBeInTheDocument();
    expect(screen.getByText('-0.2500 TON')).toBeInTheDocument();
  });

  it('TC_TXITEM_003 links to the explorer transaction page', () => {
    render(<TransactionItem tx={IN_TX} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('/transaction/aaa111'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('TC_TXITEM_004 truncates the counterparty address', () => {
    render(<TransactionItem tx={IN_TX} />);
    expect(
      screen.getByText((_, el) => el?.textContent === 'From: UQBvI0aF...Iwg5jL')
    ).toBeInTheDocument();
  });
});
