import {
  useDynamicContext,
  useHandleDisconnect,
  useHandleAuth,
} from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

export const useWalletAuth = () => {
  const { user, isAuthenticated, walletAddress } = useDynamicContext();
  const handleDisconnect = useHandleDisconnect();
  const handleAuth = useHandleAuth();

  const connectWallet = useCallback(async () => {
    await handleAuth();
  }, [handleAuth]);

  const disconnectWallet = useCallback(async () => {
    await handleDisconnect();
  }, [handleDisconnect]);

  return {
    user,
    isAuthenticated,
    walletAddress,
    connectWallet,
    disconnectWallet,
  };
};

export default useWalletAuth;