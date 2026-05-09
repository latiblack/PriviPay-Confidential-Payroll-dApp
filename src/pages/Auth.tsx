import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";
import { useWalletClient, useAccount, useSwitchChain } from "wagmi";
import { deployPayrollContract } from "@/lib/fhe/contract";
import { getAddress, isAddress } from "viem";
import { contractStore } from "@/lib/contract-store";
import { Shield, Loader2, Plus, Link2, ArrowRight, Wallet2 } from "lucide-react";

const SEPOLIA = 11155111;

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, connectWallet, walletAddress } = useWalletAuth();
  const { state, setContract, isContractOwner } = useAuth();
  const { data: walletClient } = useWalletClient();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [mode, setMode] = useState<"create" | "import" | null>(null);
  const [orgName, setOrgName] = useState("");
  const [importAddress, setImportAddress] = useState("");
  const [status, setStatus] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.contractAddress && state.isReady) {
      navigate(state.isOwner ? "/payments" : "/employee");
    }
  }, [state.contractAddress, state.isReady]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">PriviPay</CardTitle>
            <CardDescription className="text-lg">Confidential on-chain payroll</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

  const handleDeploy = async () => {
    if (!walletClient) return;
    setDeploying(true);
    setError("");
    try {
      setStatus("Deploying contract — confirm in wallet...");
      const deployed = await deployPayrollContract(walletClient);
      const checksummed = getAddress(deployed.address);
      contractStore.add(checksummed, orgName || "My Payroll", walletAddress!.toLowerCase());
      setContract(checksummed, orgName);
      setStatus("Contract deployed!");
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Deployment failed";
      setError(msg.includes("rejected") ? "Transaction rejected in wallet." : msg);
    } finally {
      setDeploying(false);
    }
  };

  const handleImport = async () => {
    if (!isAddress(importAddress)) { setError("Invalid contract address"); return; }
    setImporting(true);
    setError("");
    try {
      const addr = getAddress(importAddress);
      const isOwner = await isContractOwner(addr);
      contractStore.add(addr, "Imported Payroll", walletAddress!.toLowerCase());
      setContract(addr);
      navigate(isOwner ? "/payments" : "/employee");
    } catch {
      setError("Could not verify contract ownership.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription className="text-lg">
            {walletAddress?.slice(0, 6)}…{walletAddress?.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "create" ? (
            <>
              <div className="space-y-2">
                <Label>Payroll Name</Label>
                <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="My Company Payroll" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {status && <p className="text-sm text-muted-foreground">{status}</p>}
              <Button onClick={handleDeploy} disabled={deploying} className="w-full gap-2">
                {deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {deploying ? "Deploying…" : "Deploy Contract"}
              </Button>
              <Button variant="ghost" onClick={() => setMode(null)} className="w-full text-muted-foreground">Back</Button>
            </>
          ) : mode === "import" ? (
            <>
              <div className="space-y-2">
                <Label>Contract Address</Label>
                <Input value={importAddress} onChange={e => setImportAddress(e.target.value)} placeholder="0x..." />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleImport} disabled={importing} className="w-full gap-2">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {importing ? "Connecting…" : "Connect to Contract"}
              </Button>
              <Button variant="ghost" onClick={() => setMode(null)} className="w-full text-muted-foreground">Back</Button>
            </>
          ) : (
            <div className="space-y-3">
              <Button onClick={() => setMode("create")} size="lg" className="w-full gap-2">
                <Plus className="h-5 w-5" /> Create New Payroll <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button onClick={() => setMode("import")} variant="outline" size="lg" className="w-full gap-2">
                <Link2 className="h-5 w-5" /> Use Existing Contract <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
