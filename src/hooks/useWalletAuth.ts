import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

export const useWalletAuth = () => {
  const { user, primaryWallet, setShowAuthFlow, handleLogOut } = useDynamicContext();
  const isAuthenticated = useIsLoggedIn();
  const walletAddress = primaryWallet?.address;

  const connectWallet = useCallback(async () => {
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);

  const disconnectWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    await handleLogOut();
  }, [handleLogOut, isAuthenticated]);

  return {
    user,
    isAuthenticated,
    walletAddress,
    connectWallet,
    disconnectWallet,
  };
};

export default useWalletAuth;