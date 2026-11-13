import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Button } from '../Button';
import { Alert } from '../Alert';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Spinner } from '../Spinner';
import { CopyButton } from '../CopyButton';

describe('Button', () => {
  it('TC_UI_BUTTON_001 renders its children and handles clicks', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('TC_UI_BUTTON_002 applies the variant class', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-red-700');
  });

  it('TC_UI_BUTTON_003 disables while loading', () => {
    render(<Button isLoading>Send</Button>);
    const button = screen.getByRole('button', { name: /Send/ });
    expect(button).toBeDisabled();
  });

  it('TC_UI_BUTTON_004 honours the disabled prop', () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled();
  });
});

describe('Alert', () => {
  it('TC_UI_ALERT_001 renders the message', () => {
    render(<Alert message="Something broke" />);
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('TC_UI_ALERT_002 applies the error style by default', () => {
    const { container } = render(<Alert message="err" />);
    expect(container.firstChild).toHaveClass('border-red-700');
  });

  it('TC_UI_ALERT_003 applies the warning style', () => {
    const { container } = render(<Alert variant="warning" message="careful" />);
    expect(container.firstChild).toHaveClass('border-amber-700');
  });
});

describe('Input', () => {
  it('TC_UI_INPUT_001 renders a label and forwards value changes', () => {
    const onChange = vi.fn();
    render(<Input label="Amount" value="" onChange={onChange} />);
    expect(screen.getByText('Amount')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('TC_UI_INPUT_002 shows the error message and red border', () => {
    const { container } = render(<Input label="Amount" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(container.querySelector('input')).toHaveClass('border-red-500');
  });

  it('TC_UI_INPUT_003 shows a hint when there is no error', () => {
    render(<Input label="Amount" hint="In TON" />);
    expect(screen.getByText('In TON')).toBeInTheDocument();
  });

  it('TC_UI_INPUT_004 hides the hint when an error is present', () => {
    render(<Input label="Amount" hint="In TON" error="Required" />);
    expect(screen.queryByText('In TON')).not.toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('TC_UI_MODAL_001 renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} title="Hidden">
        body
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('TC_UI_MODAL_002 renders the title and children when open', () => {
    render(
      <Modal isOpen title="Confirm">
        body-text
      </Modal>
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('body-text')).toBeInTheDocument();
  });

  it('TC_UI_MODAL_003 calls onClose from the close button', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Confirm" onClose={onClose}>
        body
      </Modal>
    );
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('TC_UI_MODAL_004 omits the close button when onClose is absent', () => {
    render(
      <Modal isOpen title="Confirm">
        body
      </Modal>
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('Spinner', () => {
  it('TC_UI_SPIN_001 defaults to the medium size', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveClass('w-6', 'h-6');
  });

  it('TC_UI_SPIN_002 supports the large size', () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.firstChild).toHaveClass('w-8', 'h-8');
  });
});

describe('CopyButton', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TC_UI_COPY_001 copies the text and shows confirmation', async () => {
    render(<CopyButton text="EQabc" label="Copy address" />);

    fireEvent.click(screen.getByRole('button', { name: /Copy address/ }));

    expect(writeText).toHaveBeenCalledWith('EQabc');
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('TC_UI_COPY_002 reverts after two seconds', async () => {
    vi.useFakeTimers();
    render(<CopyButton text="EQabc" label="Copy" />);

    fireEvent.click(screen.getByRole('button', { name: /^Copy$/ }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });
});
