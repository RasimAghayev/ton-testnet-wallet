import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mirrors security.service.test.ts's convention: decouple from the real TON
// SDK by accepting any 48-char string starting with EQ/UQ as a valid address.
vi.mock('@ton/core', () => ({
  Address: {
    parse: vi.fn((addr: string) => {
      const t = addr.trim();
      if (t.length === 48 && /^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(t)) {
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

import { SendPage } from '../SendPage';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

const OWN_ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';
const OTHER_ADDRESS = 'UQBvI0aFLnw2QbZgjMPCLRdtRHxhUyinQudg6sdiohIwg5jL';
const ZERO_ADDRESS = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ';

function fillAndSubmit(toAddress: string, amount: string) {
  fireEvent.change(screen.getByPlaceholderText('UQ...'), { target: { value: toAddress } });
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: amount } });
  fireEvent.click(screen.getByRole('button', { name: 'Review Transaction' }));
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockSendTransaction.mockReset();
  useWalletStore.setState({
    address: OWN_ADDRESS,
    publicKey: 'abc123publickey',
    mnemonic: Array(24).fill('word'),
  });
});

afterEach(() => {
  useWalletStore.setState({ address: null, publicKey: null, mnemonic: null });
});

describe('SendPage', () => {
  it('shows field validation errors for an empty submit', () => {
    render(<SendPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Review Transaction' }));

    // sendSchema.safeParse collects one issue per failing .refine() on the
    // same field, and the component's forEach keeps only the last one seen
    // per field path — so an empty toAddress surfaces the format error
    // (not the "required" one) once both refinements fail on ''.
    expect(screen.getByText('Invalid TON address format.')).toBeInTheDocument();
    expect(screen.getByText('Minimum amount is 0.01 TON.')).toBeInTheDocument();
  });

  it('rejects a malformed address', () => {
    render(<SendPage />);
    fillAndSubmit('not-an-address', '1');

    expect(screen.getByText('Invalid TON address format.')).toBeInTheDocument();
  });

  it('is blocked by the native min="0.01" amount constraint before zod runs', () => {
    // The <input type="number" min="0.01"> constraint stops the browser from
    // ever firing the form's submit event for an out-of-range, non-empty
    // value — so zod's own "Minimum amount is 0.01 TON." refine never
    // actually runs for this case. Confirmed via a standalone probe: the
    // form's onSubmit handler is not called at all when the native
    // constraint is violated.
    render(<SendPage />);
    fillAndSubmit(OTHER_ADDRESS, '0.001');

    expect(screen.queryByText('Confirm Transaction')).not.toBeInTheDocument();
  });

  it('opens the confirm modal with a neutral style for a safe address', () => {
    render(<SendPage />);
    fillAndSubmit(OTHER_ADDRESS, '1');

    expect(screen.getByText('Confirm Transaction')).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: 'Confirm Send' });
    expect(confirmButton).toHaveClass('bg-blue-600');
    expect(screen.queryByText(/zero address|own address/)).not.toBeInTheDocument();
  });

  it('warns and switches to "Send Anyway" styling when the address is the zero address', () => {
    render(<SendPage />);
    fillAndSubmit(ZERO_ADDRESS, '1');

    // Rendered twice: once inline under the address field, once inside the
    // confirm modal — both read addressRisk straight from the same state.
    expect(screen.getAllByText('Sending to zero address.').length).toBeGreaterThan(0);
    const confirmButton = screen.getByRole('button', { name: 'Send Anyway' });
    expect(confirmButton).toHaveClass('bg-red-700');
  });

  it("warns when the recipient is the sender's own address", () => {
    render(<SendPage />);
    fillAndSubmit(OWN_ADDRESS, '1');

    expect(
      screen.getAllByText('You are sending funds to your own address.').length
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Send Anyway' })).toBeInTheDocument();
  });

  it('shows a clipboard-hijack warning when the pasted value is not a valid address', () => {
    render(<SendPage />);
    const input = screen.getByPlaceholderText('UQ...');

    fireEvent.paste(input, { clipboardData: { getData: () => 'garbage-paste' } });

    expect(screen.getByText('Invalid TON address format.')).toBeInTheDocument();
  });

  it('sends the transaction on confirm and shows the success screen', async () => {
    mockSendTransaction.mockResolvedValue('42');
    render(<SendPage />);
    fillAndSubmit(OTHER_ADDRESS, '1');

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Send' }));

    await waitFor(() => expect(screen.getByText('Transaction Sent')).toBeInTheDocument());
    expect(screen.getByText(/Seq: 42/)).toBeInTheDocument();
    expect(mockSendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ toAddress: OTHER_ADDRESS, amount: '1' })
    );
  });

  it('shows an error and stays on the form if sending fails', async () => {
    mockSendTransaction.mockRejectedValue(new Error('Network unreachable.'));
    render(<SendPage />);
    fillAndSubmit(OTHER_ADDRESS, '1');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Send' }));

    await waitFor(() => expect(screen.getByText('Network unreachable.')).toBeInTheDocument());
    expect(screen.queryByText('Transaction Sent')).not.toBeInTheDocument();
  });

  it('returns to the dashboard on back navigation', () => {
    render(<SendPage />);
    fireEvent.click(screen.getByText('← Back'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
