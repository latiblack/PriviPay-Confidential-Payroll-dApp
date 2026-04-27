import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

const fallbackAuth = {
  user: null,
  isAuthenticated: false,
  walletAddress: null,
  provider: null,
  connectWallet: async () => {
    console.warn("Dynamic auth context is unavailable.");
  },
  disconnectWallet: async () => {
    // no-op
  },
};

export const useWalletAuth = () => {
  let dynamicContext: ReturnType<typeof useDynamicContext>;

  try {
    dynamicContext = useDynamicContext();
  } catch (error) {
    console.error("Failed to load Dynamic auth context:", error);
    return fallbackAuth;
  }

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
