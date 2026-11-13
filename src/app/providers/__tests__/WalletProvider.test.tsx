import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { WalletProvider } from '../WalletProvider';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

const mockLoadFromStorage = vi.fn();
const mockCheckEncryptionStatus = vi.fn();

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <WalletProvider>
        <div>route-content</div>
      </WalletProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadFromStorage.mockReset();
  mockCheckEncryptionStatus.mockReset();
  mockCheckEncryptionStatus.mockResolvedValue(undefined);
  useWalletStore.setState({
    address: null,
    loadFromStorage: mockLoadFromStorage,
    checkEncryptionStatus: mockCheckEncryptionStatus,
    isEncrypted: false,
  });
});

describe('WalletProvider auth redirects', () => {
  it('TC_PROVIDER_AUTH_001 sends an unauthenticated user to /setup', async () => {
    mockLoadFromStorage.mockResolvedValue(false);
    renderAt('/dashboard');

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/setup', { replace: true }));
  });

  it('TC_PROVIDER_AUTH_002 leaves an unauthenticated user on /setup', async () => {
    mockLoadFromStorage.mockResolvedValue(false);
    renderAt('/setup');

    await waitFor(() => expect(mockLoadFromStorage).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('TC_PROVIDER_AUTH_003 sends an unlocked wallet on /setup to the dashboard', async () => {
    mockLoadFromStorage.mockResolvedValue(true);
    useWalletStore.setState({ isEncrypted: false });
    renderAt('/setup');

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });

  it('TC_PROVIDER_AUTH_004 sends an unlocked wallet on /unlock to the dashboard', async () => {
    mockLoadFromStorage.mockResolvedValue(true);
    useWalletStore.setState({ isEncrypted: false });
    renderAt('/unlock');

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });

  it('TC_PROVIDER_AUTH_005 sends an encrypted wallet away from /unlock to unlock', async () => {
    mockLoadFromStorage.mockResolvedValue(true);
    useWalletStore.setState({ isEncrypted: true });
    renderAt('/dashboard');

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/unlock', {
        replace: true,
        state: { from: '/dashboard' },
      })
    );
  });

  it('TC_PROVIDER_AUTH_006 leaves an encrypted wallet on /unlock', async () => {
    mockLoadFromStorage.mockResolvedValue(true);
    useWalletStore.setState({ isEncrypted: true });
    renderAt('/unlock');

    await waitFor(() => expect(mockCheckEncryptionStatus).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('TC_PROVIDER_AUTH_007 redirects to /setup when the address is cleared on a protected route', async () => {
    mockLoadFromStorage.mockResolvedValue(true);
    useWalletStore.setState({ address: null, isEncrypted: false });
    renderAt('/dashboard');

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/setup', { replace: true }));
  });

  it('TC_PROVIDER_AUTH_008 does not redirect when the address is cleared on /setup', async () => {
    mockLoadFromStorage.mockResolvedValue(false);
    useWalletStore.setState({ address: null, isEncrypted: false });
    renderAt('/setup');

    await waitFor(() => expect(mockLoadFromStorage).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
