import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";
import { useAccount, useSwitchChain } from "wagmi";
import { Wallet2 } from "lucide-react";
import Logo from "@/components/Logo";

const SEPOLIA = 11155111;

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, connectWallet, walletAddress } = useWalletAuth();
  const { state } = useAuth();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (state.isReady && (state.isOwner || state.isEmployee)) {
      navigate(state.isOwner ? "/employee" : "/employee");
    }
  }, [state.isReady, state.isOwner, state.isEmployee]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Logo size={32} alt="PriviPay" />
            </div>
            <CardTitle className="text-2xl">PriviPay</CardTitle>
            <CardDescription className="text-lg">Confidential on-chain payroll</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => connectWallet()} size="lg" className="w-full gap-2">
              <Wallet2 className="h-5 w-5" /> Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chainId && chainId !== SEPOLIA) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Wrong Network</CardTitle>
            <CardDescription>Switch to Sepolia to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => switchChain({ chainId: SEPOLIA })} className="w-full">Switch to Sepolia</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.isReady && !state.isOwner && !state.isEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <Logo size={32} alt="PriviPay" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-lg">
              Your wallet is not authorized to access this payroll contract.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p className="mb-2">Contract: {state.contractAddress?.slice(0, 10)}…</p>
            <p>Only the contract owner and registered employees can access this dApp.</p>
            <p className="mt-2">Contact the contract owner to be added as an employee.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Logo size={32} alt="PriviPay" />
          </div>
          <CardTitle className="text-2xl">Connected</CardTitle>
          <CardDescription className="text-lg">
            {walletAddress?.slice(0, 6)}…{walletAddress?.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {state.contractAddress ? (
            <p className="text-muted-foreground">Verifying contract ownership…</p>
          ) : (
            <p className="text-sm text-destructive">
              VITE_CONTRACT_ADDRESS not set in .env. Deploy the contract and add it.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
