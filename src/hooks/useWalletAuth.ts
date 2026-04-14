import {
  useDynamicContext,
  useAuthenticateConnectedUser,
} from "@dynamic-labs/sdk-react-core";
import { useCallback } from "react";

export const useWalletAuth = () => {
  const { user, isAuthenticated, walletAddress, setShowWalletModal } = useDynamicContext();
  const { authenticateWithConnectors } = useAuthenticateConnectedUser();

  const connectWallet = useCallback(() => {
    setShowWalletModal(true);
  }, [setShowWalletModal]);

  const disconnectWallet = useCallback(async () => {
    window.location.reload();
  }, []);

  return {
    user,
    isAuthenticated,
    walletAddress,
    connectWallet,
    disconnectWallet,
  };
};

export default useWalletAuth;