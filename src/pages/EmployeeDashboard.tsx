import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWalletClient, usePublicClient } from "wagmi";
import { getBalance, getEmployeeCount, getAllEmployees, getFundPool, CONFIDENTIAL_PAYROLL_ABI } from "@/lib/fhe/contract";
import { decryptUint64 } from "@/lib/fhe/decrypt";
import { formatEther, getAddress } from "viem";
import { Wallet, Loader2, Shield, DollarSign, Users, TrendingUp, Link2 } from "lucide-react";

const SEPOLIA = 11155111;

const EmployeeDashboard = () => {
  const { state } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: SEPOLIA });

  const [employeeCount, setEmployeeCount] = useState(0);
  const [fundPool, setFundPool] = useState("0");
  const [contractOwner, setContractOwner] = useState("");
  const [employeeList, setEmployeeList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Employee-specific
  const [fheBalance, setFheBalance] = useState<number | null>(null);
  const [fheHandle, setFheHandle] = useState<string | null>(null);
  const [fheDecrypted, setFheDecrypted] = useState(false);
  const [fheLoading, setFheLoading] = useState(false);

  useEffect(() => {
    if (!state.contractAddress || !publicClient || !state.isReady) return;
    const addr = state.contractAddress as `0x${string}`;
    (async () => {
      setLoading(true);
      try {
        const [count, pool, list, owner] = await Promise.all([
          getEmployeeCount(publicClient as any, addr),
          getFundPool(publicClient as any, addr),
          getAllEmployees(publicClient as any, addr),
          publicClient.readContract({ address: addr, abi: CONFIDENTIAL_PAYROLL_ABI, functionName: "owner" }) as Promise<string>,
        ]);
        setEmployeeCount(count);
        setFundPool(formatEther(pool));
        setEmployeeList(list);
        setContractOwner(owner);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [state.contractAddress, publicClient, state.isReady]);

  // Employee: fetch own encrypted balance
  useEffect(() => {
    if (state.isOwner || !state.contractAddress || !walletAddress || !publicClient) return;
    setFheHandle(null);
    setFheDecrypted(false);
    setFheBalance(null);
    (async () => {
      try {
        const addr = state.contractAddress as `0x${string}`;
        const handle = await getBalance(publicClient as any, addr, walletAddress as `0x${string}`);
        if (handle && handle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
          setFheHandle(handle);
        }
      } catch {}
    })();
  }, [state.contractAddress, walletAddress, publicClient, state.isOwner]);

  const handleDecrypt = async () => {
    if (!fheHandle || !walletClient || !state.contractAddress) return;
    setFheLoading(true);
    try {
      const decrypted = await decryptUint64(fheHandle, state.contractAddress, walletClient);
      setFheBalance(decrypted / 100);
      setFheDecrypted(true);
    } catch (err) { console.error(err); }
    finally { setFheLoading(false); }
  };

  if (loading && state.isReady) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // ─── OWNER VIEW ───
  if (state.isOwner) {
    const isYou = contractOwner.toLowerCase() === walletAddress?.toLowerCase();

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Contract overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium opacity-80 flex items-center gap-2"><Users className="h-4 w-4" />Employees</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{employeeCount}</p><p className="text-xs opacity-75 mt-1">registered on-chain</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium opacity-80 flex items-center gap-2"><TrendingUp className="h-4 w-4" />Fund Pool</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{parseFloat(fundPool).toFixed(4)}</p><p className="text-xs opacity-75 mt-1">ETH available</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium opacity-80 flex items-center gap-2"><Shield className="h-4 w-4" />Ownership</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">{isYou ? "You" : contractOwner.slice(0, 6) + "…" + contractOwner.slice(-4)}</p><p className="text-xs opacity-75 mt-1">{isYou ? "connected wallet" : "contract owner"}</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium opacity-80 flex items-center gap-2"><Link2 className="h-4 w-4" />Contract</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm font-mono break-all">{state.contractAddress?.slice(0, 10)}…</p>
              <a href={`https://sepolia.etherscan.io/address/${state.contractAddress}`} target="_blank" rel="noopener noreferrer" className="text-xs underline opacity-80 mt-1 inline-block">View on Etherscan →</a>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Employee Roster</CardTitle><CardDescription>{employeeCount} employees registered on-chain</CardDescription></CardHeader>
            <CardContent>
              {employeeList.length === 0 ? <p className="text-sm text-muted-foreground py-4">No employees yet. Go to Treasury to add some.</p> :
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {employeeList.map((addr, i) => (
                    <div key={addr} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20">
                      <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm font-mono flex-1">{addr.slice(0, 8)}…{addr.slice(-6)}</span>
                      <Badge variant="outline" className="text-xs font-mono">euint64</Badge>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <a href="/payments" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div><p className="text-sm font-medium">Treasury</p><p className="text-xs text-muted-foreground">Add employees, deposit, process payroll</p></div>
                <span className="text-primary text-sm">→</span>
              </a>
              <a href="/bonus" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div><p className="text-sm font-medium">Bonuses</p><p className="text-xs text-muted-foreground">Set monthly employee bonuses</p></div>
                <span className="text-primary text-sm">→</span>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── EMPLOYEE VIEW ───
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Contract: {state.contractAddress?.slice(0, 8)}…{state.contractAddress?.slice(-6)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Wallet</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-sm break-all">{walletAddress}</p>
            <Badge variant="outline" className="mt-2 !text-white border-white/30">Employee</Badge>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" />FHE Balance</CardTitle>
            <CardDescription className="!text-white/70">Your encrypted on-chain balance</CardDescription>
          </CardHeader>
          <CardContent>
            {fheLoading ? (
              <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>Decrypting…</span></div>
            ) : fheDecrypted ? (
              <div><p className="text-2xl font-bold">${fheBalance?.toLocaleString() ?? "0"}</p><p className="text-xs opacity-75 mt-1">Encrypted on-chain — only you can decrypt</p></div>
            ) : fheHandle ? (
              <Button variant="outline" size="sm" onClick={handleDecrypt} className="!text-white border-white/30 hover:bg-white/10"><Wallet className="h-4 w-4 mr-2" />Decrypt Balance</Button>
            ) : (
              <p className="text-sm opacity-75">No balance yet. Payroll hasn't been processed.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
