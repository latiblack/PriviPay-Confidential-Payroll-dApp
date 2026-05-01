import { useAccount, useConnect, useDisconnect } from 'wagmi';
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
  const { disconnect } = useDisconnect();
  
  const [lastKnownAddress, setLastKnownAddress] = useState<string | null>(null);
  
  // Preserve last known wallet address during chain switches
  useEffect(() => {
    if (isConnected && address) {
      setLastKnownAddress(address);
    }
  }, [isConnected, address]);

  const isAuthenticated = isConnected || !!lastKnownAddress;
  const walletAddress = address || lastKnownAddress;
  
  // Get provider from window.ethereum (injected by wallet)
  const provider = typeof window !== 'undefined' ? window.ethereum : null;

  const connectWallet = useCallback(() => {
    // Prefer Injected connector (MetaMask, etc.)
    const injectedConnector = connectors.find(c => c.type === 'injected');
    const fallbackConnector = connectors[0];

    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else if (fallbackConnector) {
      connect({ connector: fallbackConnector });
    }
  }, [connect, connectors]);

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