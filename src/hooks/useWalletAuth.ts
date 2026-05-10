import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useCallback, useState, useEffect } from 'react';

interface WalletAuthState {
  user: { userId: string } | null;
  isAuthenticated: boolean;
  walletAddress: string | null;
  provider: any;
  connectWallet: () => void;
  disconnectWallet: () => void;
}

export const useWalletAuth = (): WalletAuthState => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [lastKnownAddress, setLastKnownAddress] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) setLastKnownAddress(address);
  }, [isConnected, address]);

  const isAuthenticated = isConnected || !!lastKnownAddress;
  const walletAddress = address || lastKnownAddress;
  const provider = typeof window !== 'undefined' ? window.ethereum : null;

  const connectWallet = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    } else {
      const injected = connectors.find(c => c.type === 'injected');
      connect({ connector: injected || connectors[0] });
    }
  }, [connect, connectors, openConnectModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setLastKnownAddress(null);
  }, [disconnect]);

  return {
    user: isAuthenticated ? { userId: walletAddress || '' } : null,
    isAuthenticated,
    walletAddress,
    provider,
    connectWallet,
    disconnectWallet,
  };
};

export default useWalletAuth;