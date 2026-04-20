import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, UserProfile } from "@/lib/auth-service";
import { useWalletAuth } from "@/hooks/useWalletAuth";

interface AuthContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
  updateProfile: (updates: { displayName: string }) => Promise<void>;
  setCurrentOrganization: (org: UserProfile["currentOrganization"]) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, walletAddress } = useWalletAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile when wallet connects or changes
  useEffect(() => {
    const loadProfile = async () => {
      // Always try to fetch fresh data when we have a wallet
      if (walletAddress) {
        setIsLoading(true);
        try {
          const userProfile = await authService.login(walletAddress);
          console.log("Profile loaded from DB:", userProfile);
          setProfile(userProfile);
        } catch (error) {
          console.error("Error loading profile:", error);
          // On error, try loading from localStorage as fallback
          const stored = authService.loadProfile();
          if (stored) {
            setProfile(stored);
          }
        } finally {
          setIsLoading(false);
        }
      } else if (isAuthenticated && !walletAddress) {
        // Waiting for wallet to be created (email auth)
        setIsLoading(true);
      } else {
        // No wallet, load from localStorage
        const stored = authService.loadProfile();
        if (stored) {
          setProfile(stored);
        }
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, walletAddress]);

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (walletAddress) {
      const userProfile = await authService.login(walletAddress);
      setProfile(userProfile);
      return userProfile;
    }
    return null;
  };

  const updateProfile = async (updates: { displayName: string }) => {
    if (walletAddress) {
      await authService.updateProfile(walletAddress, updates);
      await refreshProfile();
    }
  };

  const setCurrentOrganization = (org: UserProfile["currentOrganization"]) => {
    if (profile && org) {
      const updated = { ...profile, currentOrganization: org };
      setProfile(updated);
      authService.saveProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{ profile, isLoading, refreshProfile, updateProfile, setCurrentOrganization }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthProvider;