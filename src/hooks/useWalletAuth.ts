import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

export const useWalletAuth = () => {
  let dynamicContext: ReturnType<typeof useDynamicContext> | null = null;

  // Keep the app usable even if Dynamic fails to initialize.
  // This prevents a blank screen and lets unauthenticated routes render.
  try {
    dynamicContext = useDynamicContext();
  } catch (error) {
    console.error("Dynamic context unavailable:", error);

    return {
      user: null,
      isAuthenticated: false,
      walletAddress: null,
      provider: null,
      connectWallet: async () => {
        console.warn("Dynamic auth is unavailable in this session.");
      },
      disconnectWallet: async () => {
        // no-op fallback
      },
    };
  }

  const user = dynamicContext.user;
  const primaryWallet = dynamicContext.primaryWallet;
  // User is authenticated if they have a Dynamic user (even without wallet)
  const isAuthenticated = !!user;
  // Wallet address can come from primary wallet OR from Dynamic user (for email auth)
  const walletAddress = primaryWallet?.address || user?.userId;
  // Get the provider from the wallet connector (if available)
  const provider = (primaryWallet as any)?.connector?.getProvider?.() || null;

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
    provider,
    connectWallet,
    disconnectWallet,
  };
};

export default useWalletAuth;
