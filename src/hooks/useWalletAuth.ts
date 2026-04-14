import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

export const useWalletAuth = () => {
  const dynamicContext = useDynamicContext();
  
  const user = dynamicContext.user;
  const primaryWallet = dynamicContext.primaryWallet;
  const isAuthenticated = !!(user && primaryWallet);
  const walletAddress = primaryWallet?.address;

  const connectWallet = useCallback(async () => {
    // Open Dynamic widget for wallet connection
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