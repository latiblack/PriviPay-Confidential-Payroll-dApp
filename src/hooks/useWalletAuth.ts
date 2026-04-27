import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

export const useWalletAuth = () => {
  const dynamicContext = useDynamicContext();

  const user = dynamicContext.user;
  const primaryWallet = dynamicContext.primaryWallet;
  const isAuthenticated = !!user;
  const walletAddress = primaryWallet?.address || user?.userId;
  const provider = (primaryWallet as any)?.connector?.getProvider?.() || null;

  const connectWallet = useCallback(async () => {
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
    provider,
    connectWallet,
    disconnectWallet,
  };
};

export default useWalletAuth;