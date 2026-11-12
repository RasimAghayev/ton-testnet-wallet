import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWalletStore } from '@/entities/wallet/model/wallet.store';

const PUBLIC_ROUTES = ['/setup', '/unlock'];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const loadFromStorage = useWalletStore(s => s.loadFromStorage);
  const checkEncryptionStatus = useWalletStore(s => s.checkEncryptionStatus);
  const address = useWalletStore(s => s.address);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const loaded = await loadFromStorage();
      if (!mounted) return;

      // Check if wallet is encrypted
      await checkEncryptionStatus();
      if (!mounted) return;

      const { isEncrypted: encrypted } = useWalletStore.getState();

      if (!loaded && !PUBLIC_ROUTES.includes(location.pathname)) {
        navigate('/setup', { replace: true });
        return;
      }

      if (loaded && encrypted && location.pathname !== '/unlock') {
        // Wallet is encrypted, redirect to unlock page
        navigate('/unlock', { replace: true, state: { from: location.pathname } });
        return;
      }

      if (loaded && !encrypted && location.pathname === '/setup') {
        navigate('/dashboard', { replace: true });
        return;
      }

      if (loaded && !encrypted && location.pathname === '/unlock') {
        navigate('/dashboard', { replace: true });
        return;
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Guard on address changes (e.g., after clearWallet)
  useEffect(() => {
    if (address === null && !PUBLIC_ROUTES.includes(location.pathname)) {
      navigate('/setup', { replace: true });
    }
  }, [address, location.pathname, navigate]);

  return <>{children}</>;
}
