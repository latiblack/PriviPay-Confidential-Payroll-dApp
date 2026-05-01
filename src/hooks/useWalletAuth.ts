import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback, useState, useEffect } from "react";

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
 const [lastKnownWallet, setLastKnownWallet] = useState<{
  user: any;
  walletAddress: string | null;
  provider: any;
 } | null>(null);

 let dynamicContext: ReturnType<typeof useDynamicContext>;
 let user: any = null;
 let primaryWallet: any = null;
 let isAvailable = false;

 try {
  dynamicContext = useDynamicContext();
  user = dynamicContext.user;
  primaryWallet = dynamicContext.primaryWallet;
  isAvailable = true;
 } catch (error) {
  console.warn("Dynamic auth context temporarily unavailable:", error);
  // Don't return fallback - keep last known state
 }

 // Preserve last known wallet state during chain switches
 useEffect(() => {
  if (isAvailable && user) {
   const walletAddress = primaryWallet?.address || user?.userId;
   const provider = primaryWallet?.connector?.getProvider?.() || null;
   setLastKnownWallet({ user, walletAddress, provider });
  }
 }, [isAvailable, user, primaryWallet]);

 const isAuthenticated = !!user;
 const walletAddress = primaryWallet?.address || user?.userId || lastKnownWallet?.walletAddress || null;
 const provider = (primaryWallet as any)?.connector?.getProvider?.() || lastKnownWallet?.provider || null;

 // Only show as not authenticated if we never had a wallet OR explicitly logged out
 const isActuallyAuthenticated = isAuthenticated || !!lastKnownWallet?.walletAddress;

 const connectWallet = useCallback(async () => {
  if (dynamicContext) {
   dynamicContext.setShowAuthFlow?.(true);
  } else {
   console.warn("Dynamic auth context not available");
  }
 }, [dynamicContext]);

 const disconnectWallet = useCallback(async () => {
  if (!isActuallyAuthenticated) return;
  try {
   if (dynamicContext?.handleLogOut) {
    await dynamicContext.handleLogOut();
   }
   setLastKnownWallet(null);
  } catch (e) {
   window.location.reload();
  }
 }, [dynamicContext, isActuallyAuthenticated]);

 return {
  user: user || lastKnownWallet?.user,
  isAuthenticated: isActuallyAuthenticated,
  walletAddress,
  provider,
  connectWallet,
  disconnectWallet,
 };
};

export default useWalletAuth;
