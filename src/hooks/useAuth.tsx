import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { usePublicClient } from "wagmi";
import { CONFIDENTIAL_PAYROLL_ABI } from "@/lib/fhe/contract";

export interface AppState {
  walletAddress: string | null;
  contractAddress: string | null;
  isOwner: boolean;
  isReady: boolean;
}

interface AuthContextType {
  state: AppState;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { walletAddress } = useWalletAuth();
  const publicClient = usePublicClient({ chainId: 11155111 });

  const [contractAddress] = useState<string | null>(
    () => import.meta.env.VITE_CONTRACT_ADDRESS || null
  );
  const [isOwner, setIsOwner] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!contractAddress || !walletAddress || !publicClient) {
      setIsOwner(false);
      setIsReady(false);
      return;
    }
    (async () => {
      try {
        const owner = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: CONFIDENTIAL_PAYROLL_ABI,
          functionName: "owner",
        }) as string;
        setIsOwner(owner.toLowerCase() === walletAddress.toLowerCase());
      } catch {
        setIsOwner(false);
      }
      setIsReady(true);
    })();
  }, [contractAddress, walletAddress, publicClient]);

  const state: AppState = {
    walletAddress: walletAddress || null,
    contractAddress,
    isOwner,
    isReady,
  };

  return (
    <AuthContext.Provider value={{ state }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthProvider;
