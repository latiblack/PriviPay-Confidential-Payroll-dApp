import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWalletClient, useAccount, useSwitchChain, usePublicClient } from "wagmi";
import { encryptUint64 } from "@/lib/fhe/encrypt";
import { setBonus, getAllEmployees, getSalary } from "@/lib/fhe/contract";
import { getAddress } from "viem";
import { DollarSign, Loader2, Gift, Plus } from "lucide-react";

const SEPOLIA = 11155111;

const Bonuses = () => {
  const { state } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { data: walletClient } = useWalletClient();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: SEPOLIA });
  const { toast } = useToast();
  const isOwner = state.isOwner;

  const [employees, setEmployees] = useState<{ address: string; salaryCents: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state.contractAddress || !publicClient) return;
    (async () => {
      setLoading(true);
      try {
        const addr = state.contractAddress as `0x${string}`;
        const list = await getAllEmployees(publicClient as any, addr);
        const data = [];
        for (const empAddr of list) {
          const sal = await getSalary(publicClient as any, addr, empAddr).catch(() => "0");
          data.push({ address: empAddr, salaryCents: Number(sal || 0) });
        }
        setEmployees(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [state.contractAddress, publicClient]);

  const handleSetBonus = async () => {
    if (!walletClient || !state.contractAddress || !selectedEmployee || !bonusAmount) return;
    setSaving(true);
    try {
      const addr = state.contractAddress as `0x${string}`;
      const empAddr = getAddress(selectedEmployee);
      if (chainId !== SEPOLIA) await switchChain({ chainId: SEPOLIA });

      const cents = Math.round(parseFloat(bonusAmount) * 100);
      const encrypted = await encryptUint64(cents, state.contractAddress, walletAddress!);
      const txHash = await setBonus(walletClient, addr, empAddr, encrypted.handle, encrypted.inputProof);

      toast({ title: "Bonus Set", description: `$${bonusAmount} bonus set on-chain for ${empAddr.slice(0, 6)}…` });
      setShowAdd(false);
      setSelectedEmployee("");
      setBonusAmount("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.shortMessage || err?.message || "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  };

  // For employees: only show their own row
  const myAddress = walletAddress?.toLowerCase();
  const displayEmployees = isOwner ? employees : employees.filter(e => e.address.toLowerCase() === myAddress);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isOwner ? "Bonuses" : "My Bonus"}</h1>
          <p className="text-muted-foreground mt-1">{isOwner ? "Set employee bonuses on-chain" : "View your bonus"}</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowAdd(!showAdd)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Set Bonus
          </Button>
        )}
      </div>

      {showAdd && (
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-base">Set Bonus</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Employee</Label>
              <select className="w-full p-2 border rounded-lg bg-background" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                <option value="">Select…</option>
                {employees.map(e => <option key={e.address} value={e.address}>{e.address.slice(0, 8)}… — ${(e.salaryCents / 100).toLocaleString()}/mo</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>Bonus (USD)</Label><Input type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder="500" /></div>
            <Button onClick={handleSetBonus} disabled={saving} className="w-full gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}{saving ? "Setting…" : "Set Bonus On-Chain"}</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gift className="h-4 w-4" />Bonuses</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> :
           displayEmployees.length === 0 ? <p className="text-center py-8 text-muted-foreground">No employees.</p> :
           <div className="space-y-2">
            {displayEmployees.map((emp, i) => (
              <div key={emp.address} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div><p className="text-sm font-mono">{emp.address.slice(0, 8)}…{emp.address.slice(-6)}</p><p className="text-xs text-muted-foreground">Salary: ${(emp.salaryCents / 100).toLocaleString()}/mo</p></div>
                <Badge variant="outline" className="text-xs">Active</Badge>
              </div>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Bonuses;
