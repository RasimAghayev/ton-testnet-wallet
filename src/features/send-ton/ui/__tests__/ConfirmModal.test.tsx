import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from '../ConfirmModal';
import type { SendFormData } from '../../lib/validation';

const ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';
const DATA: SendFormData = { toAddress: ADDRESS, amount: '0.5', comment: 'invoice' };

describe('ConfirmModal', () => {
  it('TC_CONFIRMMODAL_001 renders nothing without data', () => {
    const { container } = render(
      <ConfirmModal
        isOpen
        data={null}
        addressRisk={null}
        isSending={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('TC_CONFIRMMODAL_002 shows the transaction details', () => {
    render(
      <ConfirmModal
        isOpen
        data={DATA}
        addressRisk={null}
        isSending={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(DATA.toAddress)).toBeInTheDocument();
    expect(screen.getByText('0.5 TON')).toBeInTheDocument();
    expect(screen.getByText('invoice')).toBeInTheDocument();
  });

  it('TC_CONFIRMMODAL_003 uses a neutral confirm button for a safe address', () => {
    render(
      <ConfirmModal
        isOpen
        data={DATA}
        addressRisk={{ risk: 'safe' }}
        isSending={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const confirm = screen.getByRole('button', { name: 'Confirm Send' });
    expect(confirm).toHaveClass('bg-blue-600');
    expect(screen.queryByText(/own address|zero address/)).not.toBeInTheDocument();
  });

  it('TC_CONFIRMMODAL_004 warns and uses Send Anyway for a suspicious address', () => {
    render(
      <ConfirmModal
        isOpen
        data={DATA}
        addressRisk={{ risk: 'suspicious', reason: 'Sending to zero address.' }}
        isSending={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Sending to zero address.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Anyway' })).toHaveClass('bg-red-700');
  });

  it('TC_CONFIRMMODAL_005 invokes onConfirm and onCancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        isOpen
        data={DATA}
        addressRisk={{ risk: 'safe' }}
        isSending={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Send' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('TC_CONFIRMMODAL_006 disables both actions while sending', () => {
    render(
      <ConfirmModal
        isOpen
        data={DATA}
        addressRisk={{ risk: 'safe' }}
        isSending
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Confirm Send/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
