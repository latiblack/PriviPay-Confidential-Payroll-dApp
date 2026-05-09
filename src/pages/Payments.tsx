import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWalletClient, useAccount, useSwitchChain, useBalance, usePublicClient } from "wagmi";
import { encryptUint64 } from "@/lib/fhe/encrypt";
import { getEmployeeCount, getAllEmployees, getFundPool, addEmployee, setSalary, processPayroll, depositFunds, withdrawFunds, CONFIDENTIAL_PAYROLL_ABI } from "@/lib/fhe/contract";
import { getAddress, parseEther, formatEther } from "viem";
import { Wallet, DollarSign, Loader2, ArrowDownToLine, Plus, Send, Users, RefreshCw, ExternalLink } from "lucide-react";

const SEPOLIA = 11155111;

interface Employee {
  address: string;
}

const Payments = () => {
  const { state } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { data: walletClient } = useWalletClient();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: SEPOLIA });
  const { toast } = useToast();
  const { data: balanceData, refetch: refetchBalance } = useBalance({ address: walletAddress as `0x${string}`, chainId: SEPOLIA });
  const isOwner = state.isOwner;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fundPool, setFundPool] = useState("0");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Add employee form
  const [showAdd, setShowAdd] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [saving, setSaving] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState("");

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const fetchData = async () => {
    if (!state.contractAddress || !publicClient) return;
    setLoading(true);
    try {
      const addr = state.contractAddress as `0x${string}`;
      const count = await getEmployeeCount(publicClient as any, addr);
      const pool = await getFundPool(publicClient as any, addr);
      setFundPool(formatEther(pool));

      const chainEmployees = await getAllEmployees(publicClient as any, addr);
      const empData: Employee[] = chainEmployees.map((addr: string) => ({ address: addr }));
      setEmployees(empData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [state.contractAddress, publicClient]);

  const handleAddEmployee = async () => {
    if (!walletClient || !state.contractAddress || !newAddress || !newSalary) return;
    setSaving(true);
    try {
      const empAddr = getAddress(newAddress);
      const addr = state.contractAddress as `0x${string}`;
      const salaryCents = Math.round(parseFloat(newSalary) * 100);

      if (chainId !== SEPOLIA) await switchChain({ chainId: SEPOLIA });

      await addEmployee(walletClient, addr, empAddr);
      const encrypted = await encryptUint64(salaryCents, state.contractAddress, walletAddress!);
      await setSalary(walletClient, addr, empAddr, encrypted.handle, encrypted.inputProof);

      toast({ title: "Employee Added", description: `${empAddr.slice(0, 6)}…${empAddr.slice(-4)} added with salary $${newSalary}` });
      setShowAdd(false);
      setNewAddress("");
      setNewSalary("");
      fetchData();
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleProcessPayroll = async () => {
    if (!walletClient || !state.contractAddress || !depositAmount) return;
    setProcessing(true);
    try {
      const addr = state.contractAddress as `0x${string}`;
      if (chainId !== SEPOLIA) await switchChain({ chainId: SEPOLIA });

      const wei = parseEther(depositAmount);
      toast({ title: "Step 1/2", description: "Depositing ETH..." });
      const depositTx = await depositFunds(walletClient, addr, wei);
      await publicClient!.waitForTransactionReceipt({ hash: depositTx as `0x${string}` });

      toast({ title: "Step 2/2", description: "Processing payroll..." });
      const txHash = await processPayroll(walletClient, addr);
      await publicClient!.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

      toast({ title: "Payroll Processed", description: `${depositAmount} ETH deposited & payroll processed` });
      setDepositAmount("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err?.shortMessage || err?.message || "Failed", variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const handleWithdraw = async () => {
    if (!walletClient || !state.contractAddress || !withdrawAmount) return;
    setProcessing(true);
    try {
      const addr = state.contractAddress as `0x${string}`;
      if (chainId !== SEPOLIA) await switchChain({ chainId: SEPOLIA });

      const wei = parseEther(withdrawAmount);
      const txHash = await withdrawFunds(walletClient, addr, wei);
      await publicClient!.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

      toast({ title: "Withdrawn", description: `${withdrawAmount} ETH withdrawn` });
      setWithdrawAmount("");
      fetchData();
      refetchBalance();
    } catch (err: any) {
      toast({ title: "Error", description: err?.shortMessage || err?.message || "Failed", variant: "destructive" });
    } finally { setProcessing(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isOwner ? "Treasury" : "My Pay"}</h1>
          <p className="text-muted-foreground mt-1">
            Contract: {state.contractAddress?.slice(0, 8)}…{state.contractAddress?.slice(-6)}
            <a href={`https://sepolia.etherscan.io/address/${state.contractAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 ml-2 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> Etherscan
            </a>
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowAdd(!showAdd)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isOwner && (
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white"><CardHeader className="pb-2"><CardTitle className="text-xs font-medium opacity-90">Employees</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{employees.length}</p></CardContent></Card>
        )}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white"><CardHeader className="pb-2"><CardTitle className="text-xs font-medium opacity-90">Contract Pool</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{parseFloat(fundPool).toFixed(4)} ETH</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white"><CardHeader className="pb-2"><CardTitle className="text-xs font-medium opacity-90">Wallet ETH</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{balanceData ? parseFloat(balanceData.formatted).toFixed(4) : "0"} ETH</p></CardContent></Card>
      </div>

      {/* Add Employee Dialog */}
      {showAdd && (
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-base">Add Employee</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Wallet Address</Label><Input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="0x..." /></div>
            <div className="space-y-1"><Label>Monthly Salary (USD)</Label><Input type="number" value={newSalary} onChange={e => setNewSalary(e.target.value)} placeholder="2500" /></div>
            <Button onClick={handleAddEmployee} disabled={saving} className="w-full gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? "Adding…" : "Add to Payroll"}</Button>
          </CardContent>
        </Card>
      )}

      {/* Process Payroll - Owner only */}
      {isOwner && (
        <Card>
          <CardHeader><CardTitle className="text-base">Process Payroll</CardTitle><CardDescription>Deposit ETH and distribute salaries + bonuses</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>ETH to Deposit</Label><Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.01" /></div>
            <Button onClick={handleProcessPayroll} disabled={processing || !depositAmount} className="w-full gap-2">{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{processing ? "Processing…" : "Deposit & Process Payroll"}</Button>
          </CardContent>
        </Card>
      )}

      {/* Withdraw - Non-owner */}
      {!isOwner && (
        <Card>
          <CardHeader><CardTitle className="text-base">Withdraw Funds</CardTitle><CardDescription>Withdraw your earned salary from the contract pool</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>ETH Amount</Label><Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.001" /></div>
            <Button onClick={handleWithdraw} disabled={processing || !withdrawAmount} className="w-full gap-2">{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}{processing ? "Withdrawing…" : "Withdraw"}</Button>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />{isOwner ? "Employees" : "My Info"}</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> :
           employees.length === 0 ? <p className="text-center py-8 text-muted-foreground">No employees yet.</p> :
           <div className="space-y-2">
            {(isOwner ? employees : employees.filter(e => e.address.toLowerCase() === walletAddress?.toLowerCase())).map((emp, i) => (
              <div key={emp.address} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">{i + 1}</div>
                  <p className="text-sm font-mono">{emp.address.slice(0, 8)}…{emp.address.slice(-6)}</p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">euint64</Badge>
              </div>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
