import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

export const useWalletAuth = () => {
  const dynamicContext = useDynamicContext();
  
  const user = dynamicContext.user;
  const primaryWallet = dynamicContext.primaryWallet;
  // User is authenticated if they have a Dynamic user (even without wallet)
  const isAuthenticated = !!user;
  // Wallet address can come from primary wallet OR from Dynamic user (for email auth)
  const walletAddress = primaryWallet?.address || user?.userId;

  const connectWallet = useCallback(async () => {
    // Open Dynamic widget for wallet connection or email login
    dynamicContext.setShowAuthFlow?.(true);
  }, [dynamicContext]);

  const disconnectWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await dynamicContext.handleLogOut?.();
    } catch (e) {
      window.location.reload();
    }
  }, [dynamicContext, isAuthenticated]);

  return {
    user,
    isAuthenticated,
    walletAddress,
    connectWallet,
    disconnectWallet,
  };
};

export default useWalletAuth;