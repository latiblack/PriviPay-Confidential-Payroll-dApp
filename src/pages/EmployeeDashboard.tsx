import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWalletClient, usePublicClient, useAccount } from "wagmi";
import { getBalance } from "@/lib/fhe/contract";
import { decryptUint64 } from "@/lib/fhe/decrypt";
import { formatEther } from "viem";
import { Wallet, Loader2, Shield, DollarSign } from "lucide-react";

const SEPOLIA = 11155111;

const EmployeeDashboard = () => {
  const { state } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: SEPOLIA });

  const [fheBalance, setFheBalance] = useState<number | null>(null);
  const [fheHandle, setFheHandle] = useState<string | null>(null);
  const [fheDecrypted, setFheDecrypted] = useState(false);
  const [fheLoading, setFheLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Read encrypted balance handle from contract
  useEffect(() => {
    if (!state.contractAddress || !walletAddress || !publicClient) return;
    setFheHandle(null);
    setFheDecrypted(false);
    setFheBalance(null);
    setLoading(true);
    (async () => {
      try {
        const addr = state.contractAddress as `0x${string}`;
        const handle = await getBalance(publicClient as any, addr, walletAddress as `0x${string}`);
        if (handle && handle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
          setFheHandle(handle);
        }
      } catch { /* employee might not be on contract yet */ }
      setLoading(false);
    })();
  }, [state.contractAddress, walletAddress, publicClient]);

  const handleDecrypt = async () => {
    if (!fheHandle || !walletClient || !state.contractAddress) return;
    setFheLoading(true);
    try {
      const decrypted = await decryptUint64(fheHandle, state.contractAddress, walletClient);
      setFheBalance(decrypted / 100); // cents to dollars
      setFheDecrypted(true);
    } catch (err) {
      console.error("Decrypt failed:", err);
    } finally {
      setFheLoading(false);
    }
  };

  if (state.isOwner) {
    // Owners use Payments page for everything
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Owner View</CardTitle><CardDescription>Manage payroll from the Treasury page.</CardDescription></CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Contract: {state.contractAddress?.slice(0, 8)}…{state.contractAddress?.slice(-6)}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm break-all">{walletAddress}</p>
                <Badge variant="outline" className="mt-2">{state.isOwner ? "Owner" : "Employee"}</Badge>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" />FHE Balance</CardTitle>
                <CardDescription>Your encrypted on-chain balance</CardDescription>
              </CardHeader>
              <CardContent>
                {fheLoading ? (
                  <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Decrypting…</span></div>
                ) : fheDecrypted ? (
                  <div>
                    <p className="text-2xl font-bold">${fheBalance?.toLocaleString() ?? "0"}</p>
                    <p className="text-xs opacity-75 mt-1">Encrypted on-chain — decrypted for you</p>
                  </div>
                ) : fheHandle ? (
                  <Button variant="outline" size="sm" onClick={handleDecrypt}><Wallet className="h-4 w-4 mr-2" />Decrypt Balance</Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No balance yet. Wait for payroll to be processed.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeDashboard;
