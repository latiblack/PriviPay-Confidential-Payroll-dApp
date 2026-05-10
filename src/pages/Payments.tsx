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
import { decryptUint64 } from "@/lib/fhe/decrypt";
import { getEmployeeCount, getAllEmployees, getFundPool, getSalary, getBalance, getBonus, getTotalCompensation, updateTotalCompensation, addEmployee, setSalary, processPayroll, depositFunds, withdrawFunds, CONFIDENTIAL_PAYROLL_ABI } from "@/lib/fhe/contract";
import { getAddress, parseEther, formatEther, parseAbiItem } from "viem";
import { Wallet, DollarSign, Loader2, ArrowDownToLine, Plus, Send, Users, RefreshCw, ExternalLink, Info } from "lucide-react";

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
  const [withdrawTotal, setWithdrawTotal] = useState("0");

  // Fetch total withdrawn for employee
  useEffect(() => {
    if (!state.contractAddress || !publicClient || !walletAddress || state.isOwner) return;
    (async () => {
      try {
        const fromBlock = await publicClient.getBlockNumber().then(b => b - 10000n).catch(() => 0n);
        const logs = await publicClient.getLogs({
          address: state.contractAddress as `0x${string}`,
          event: parseAbiItem("event Withdrawn(address indexed employee, uint256 amount)"),
          args: { employee: walletAddress as `0x${string}` },
          fromBlock,
          toBlock: "latest",
        });
        const total = logs.reduce((s, l) => s + ((l as any).args.amount as bigint), 0n);
        setWithdrawTotal(formatEther(total));
      } catch {}
    })();
  }, [state.contractAddress, publicClient, walletAddress, state.isOwner]);

  // Add employee form
  const [showAdd, setShowAdd] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [saving, setSaving] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState("");
  const [totalCompHandle, setTotalCompHandle] = useState<string | null>(null);
  const [totalCompUSD, setTotalCompUSD] = useState(0);
  const [decryptingTotal, setDecryptingTotal] = useState(false);
  const [decrypting, setDecrypting] = useState<Record<string, boolean>>({});
  const [decryptedVals, setDecryptedVals] = useState<Record<string, string>>({});

  const decryptField = async (empAddr: string, field: "salary" | "balance" | "bonus") => {
    if (!walletClient || !state.contractAddress) return;
    const key = `${empAddr}-${field}`;
    setDecrypting(prev => ({ ...prev, [key]: true }));
    try {
      const addr = state.contractAddress as `0x${string}`;
      const fn = field === "salary" ? getSalary : field === "bonus" ? getBonus : getBalance;
      const handle = await fn(publicClient as any, addr, empAddr as `0x${string}`);
      const cents = await decryptUint64(handle, state.contractAddress, walletClient);
      setDecryptedVals(prev => ({ ...prev, [key]: `$${(cents / 100).toLocaleString()}` }));
    } catch (err: any) {
      setDecryptedVals(prev => ({ ...prev, [key]: "Failed" }));
    }
    setDecrypting(prev => ({ ...prev, [key]: false }));
  };
  const [ethPrice, setEthPrice] = useState(0);

  // Fetch ETH price
  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
      .then(r => r.json()).then(d => setEthPrice(d.ethereum?.usd || 0)).catch(() => {});
  }, []);

  const decryptTotal = async () => {
    if (!walletClient || !state.contractAddress) return;
    setDecryptingTotal(true);
    setTotalCompUSD(0);
    try {
      const addr = state.contractAddress as `0x${string}`;
      toast({ title: "Step 1/3", description: "Computing total on-chain (FHE)…" });
      const txHash = await updateTotalCompensation(walletClient, addr);
      await publicClient!.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

      toast({ title: "Step 2/3", description: "Reading encrypted total…" });
      const handle = await getTotalCompensation(publicClient as any, addr);
      console.log("Total handle:", handle);

      toast({ title: "Step 3/3", description: "Decrypting total — sign in wallet…" });
      const cents = await decryptUint64(handle, state.contractAddress, walletClient);
      console.log("Decrypted cents:", cents);
      const usd = cents / 100;
      setTotalCompUSD(usd);
      setTotalCompHandle(handle);
      if (ethPrice > 0) setDepositAmount((usd / ethPrice).toFixed(6));
      toast({ title: "Done", description: `Total payroll: $${usd.toLocaleString()}` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.shortMessage || err?.message || "Failed", variant: "destructive" });
    }
    finally { setDecryptingTotal(false); }
  };

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const friendlyError = (err: any) => {
    const raw = String(err?.shortMessage || err?.cause?.reason || err?.message || err);
    if (/AlreadyEmployee/i.test(raw)) return "This wallet is already registered as an employee.";
    if (/NotOwner/i.test(raw)) return "Only the contract owner can perform this action.";
    if (/NotEmployee/i.test(raw)) return "This wallet is not registered as an employee.";
    if (/rejected|denied/i.test(raw)) return "Transaction rejected in wallet.";
    if (/insufficient/i.test(raw)) return "Insufficient Sepolia ETH for gas.";
    if (/429|Too Many/i.test(raw)) return "RPC rate limited. Please wait a moment and try again.";
    return raw || "Transaction failed";
  };

  const fetchData = async () => {
    if (!state.contractAddress || !publicClient) return;
    setLoading(true);
    try {
      const addr = state.contractAddress as `0x${string}`;
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

      const count = await getEmployeeCount(publicClient as any, addr);
      await sleep(200);
      const pool = await getFundPool(publicClient as any, addr);
      setFundPool(formatEther(pool));

      await sleep(200);
      const chainEmployees = await getAllEmployees(publicClient as any, addr);
      const empData: Employee[] = chainEmployees.map((addr: string) => ({ address: addr }));
      setEmployees(empData);

      // Fetch total compensation (encrypted handle, FHE sum of all salaries + bonuses)
      if (isOwner) {
        await sleep(200);
        try {
          const handle = await getTotalCompensation(publicClient as any, addr);
          setTotalCompHandle(handle);
        } catch {}
      }
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

      console.log("Adding employee:", empAddr, "salary cents:", salaryCents);
      const addTx = await addEmployee(walletClient, addr, empAddr);
      console.log("addEmployee tx:", addTx);
      await publicClient!.waitForTransactionReceipt({ hash: addTx as `0x${string}` });
      console.log("addEmployee confirmed");

      const encrypted = await encryptUint64(salaryCents, state.contractAddress, walletAddress!);
      console.log("Encrypted handle:", encrypted.handle.slice(0, 20), "... proof:", encrypted.inputProof.slice(0, 20));
      
      const salTx = await setSalary(walletClient, addr, empAddr, encrypted.handle, encrypted.inputProof);
      console.log("setSalary tx:", salTx);
      await publicClient!.waitForTransactionReceipt({ hash: salTx as `0x${string}` });
      console.log("setSalary confirmed");

      toast({ title: "Employee Added", description: `${empAddr.slice(0, 6)}…${empAddr.slice(-4)} added with salary $${newSalary}` });
      setShowAdd(false);
      setNewSalary("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: friendlyError(err), variant: "destructive" });
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
      toast({ title: "Error", description: friendlyError(err), variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const handleWithdraw = async () => {
    if (!walletClient || !state.contractAddress || !withdrawAmount) return;
    setProcessing(true);
    try {
      const addr = state.contractAddress as `0x${string}`;
      if (chainId !== SEPOLIA) await switchChain({ chainId: SEPOLIA });

      const dollarAmount = parseFloat(withdrawAmount);
      const cents = BigInt(Math.round(dollarAmount * 100));
      const ethWei = parseEther((dollarAmount / (ethPrice || 3000)).toFixed(18));
      
      const txHash = await withdrawFunds(walletClient, addr, cents, ethWei);
      await publicClient!.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

      toast({ title: "Withdrawn", description: `$${dollarAmount.toFixed(2)} withdrawn (${formatEther(ethWei)} ETH)` });
      setWithdrawAmount("");
      fetchData();
      refetchBalance();
      setWithdrawTotal(prev => (parseFloat(prev) + parseFloat(formatEther(ethWei))).toFixed(6));
    } catch (err: any) {
      toast({ title: "Error", description: friendlyError(err), variant: "destructive" });
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
        {!isOwner && (
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white [&_*]:text-white"><CardHeader className="pb-2"><CardTitle className="text-xs font-medium opacity-90">Total Withdrawn</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{parseFloat(withdrawTotal).toFixed(4)} ETH</p></CardContent></Card>
        )}
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
          <CardHeader>
            <CardTitle className="text-base">Process Payroll</CardTitle>
            <CardDescription>
              Deposit ETH to distribute salaries + bonuses to {employees.length} employee{employees.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border text-sm">
              <span className="text-muted-foreground">Total payroll (FHE sum)</span>
              {totalCompUSD > 0 ? (
                <span className="font-semibold">${totalCompUSD.toLocaleString()}</span>
              ) : (
                <Button variant="outline" size="sm" onClick={decryptTotal} disabled={decryptingTotal}>
                  {decryptingTotal ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Calculate
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <Label>ETH to Deposit</Label>
              <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.01" />
              {ethPrice > 0 && depositAmount && (
                <p className="text-xs text-muted-foreground">≈ ${(parseFloat(depositAmount) * ethPrice).toFixed(2)} USD</p>
              )}
            </div>
            <Button onClick={handleProcessPayroll} disabled={processing || !depositAmount} className="w-full gap-2">{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{processing ? "Processing…" : "Deposit & Process Payroll"}</Button>
          </CardContent>
        </Card>
      )}

      {/* Withdraw - Non-owner */}
      {!isOwner && (
        <Card>
          <CardHeader><CardTitle className="text-base">Withdraw Funds</CardTitle><CardDescription>Withdraw your earned salary from the contract pool</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Amount (USD)</Label><Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="100" /></div>
            {ethPrice > 0 && withdrawAmount && (
              <p className="text-xs text-muted-foreground">≈ {(parseFloat(withdrawAmount) / ethPrice).toFixed(6)} ETH</p>
            )}
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
            {(isOwner ? employees : employees.filter(e => e.address.toLowerCase() === walletAddress?.toLowerCase())).map((emp, i) => {
              const sKey = `${emp.address}-salary`;
              return (
                <div key={emp.address} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">{i + 1}</div>
                    <div>
                      <p className="text-sm font-mono">{emp.address.slice(0, 8)}…{emp.address.slice(-6)}</p>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => decryptField(emp.address, "salary")} disabled={decrypting[sKey]} className="text-xs text-primary hover:underline">
                            {decrypting[sKey] ? <Loader2 className="h-3 w-3 animate-spin inline" /> : decryptedVals[sKey] ? decryptedVals[sKey] : "Salary ▸"}
                          </button>
                          <span className="text-xs text-muted-foreground">|</span>
                          <button onClick={() => decryptField(emp.address, "bonus")} disabled={decrypting[`${emp.address}-bonus`]} className="text-xs text-primary hover:underline">
                            {decrypting[`${emp.address}-bonus`] ? <Loader2 className="h-3 w-3 animate-spin inline" /> : decryptedVals[`${emp.address}-bonus`] ? decryptedVals[`${emp.address}-bonus`] : "Bonus ▸"}
                          </button>
                        </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">euint64</Badge>
                </div>
              );
            })}
            </div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;

