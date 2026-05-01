import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAccount, useSwitchChain, useBalance, useWalletClient } from 'wagmi';
import { useTranslation } from "@/hooks/useTranslation";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import ethereumService from "@/lib/ethereum";
import {
  DollarSign, Users, Send, Loader2, ArrowDownToLine,
  Plus, Trash2, Edit, UserPlus, CheckCircle2, AlertCircle, Wallet, RefreshCw
} from "lucide-react";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

interface EmployeeFormData {
  name: string;
  wallet_address: string;
  position: string;
  department: string;
  salary: string;
}

const PaymentsPage = () => {
  const { profile } = useAuth();
  const { walletAddress, provider } = useWalletAuth();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: walletAddress as `0x${string}`,
    chainId: 11155111, // Sepolia
  });
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isOwner = profile?.currentRole === "owner";
  const isStaff = profile?.currentRole === "staff";

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [availableMembers, setAvailableMembers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [ownSalary, setOwnSalary] = useState<string>("$0");

  // Employee management state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>({
    name: "",
    wallet_address: "",
    position: "",
    department: "",
    salary: "",
  });
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
const [ethBalance, setEthBalance] = useState("0");
  const [ethConnected, setEthConnected] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [totalReceived, setTotalReceived] = useState<string>("$0.00");
  const [loadingTotalReceived, setLoadingTotalReceived] = useState(false);
  const SEPOLIA_CHAIN_ID_NUM = 11155111;

const fetchData = async () => {
  if (!profile?.currentOrganization?.id || !profile?.walletAddress) {
    setLoading(false);
    return;
  }

    try {
      // Get employees in payroll
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get all members from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id);

      if (roleError) throw roleError;

      // Get bonuses
      const { data: bonusData, error: bonusError } = await supabase
        .from("bonuses")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id);

      if (bonusError) throw bonusError;

      // Filter to show employees in payroll (salary > 0)
      const payrollEmployees = (data || []).filter(e => Number(e.encrypted_salary) > 0);
      
      // Add bonus to each employee
      const employeesWithBonus = payrollEmployees.map(emp => {
        const empBonuses = (bonusData || []).filter(b => b.employee_id === emp.id);
        const totalBonus = empBonuses.reduce((sum, b) => sum + b.amount, 0);
        return { ...emp, bonus: totalBonus };
      });
      
      setEmployees(employeesWithBonus);

      // Get all addresses in employees table (including those with $0)
      const employeeAddresses = new Set((data || []).map(e => e.wallet_address?.toLowerCase()));

      // Available = members NOT in employees table OR in employees with $0 salary
      const employeesWithZero = new Set(
        (data || [])
          .filter(e => Number(e.encrypted_salary) === 0)
          .map(e => e.wallet_address?.toLowerCase())
      );

      const available = (roleData || []).filter(m => 
        m.user_id && (!employeeAddresses.has(m.user_id.toLowerCase()) || employeesWithZero.has(m.user_id.toLowerCase()))
      );
      setAvailableMembers(available);

      // Get own salary with bonus - lowercase comparison
      const mySalary = data?.find(e => e.wallet_address?.toLowerCase() === profile.walletAddress?.toLowerCase());
      const myBonus = (bonusData || [])
        .filter(b => {
          const emp = data?.find(e => e.wallet_address?.toLowerCase() === profile.walletAddress?.toLowerCase());
          return emp && b.employee_id === emp.id;
        })
        .reduce((sum, b) => sum + b.amount, 0);
      const sal = Number(mySalary?.encrypted_salary || 0) + myBonus;
      setOwnSalary(formatCurrency(sal));

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
setLoading(false);
  }
};

const handleSwitchToSepolia = async () => {
    if (!walletAddress) {
      toast({ title: "No wallet connected", variant: "destructive" });
      return;
    }
    try {
      await switchChain({ chainId: SEPOLIA_CHAIN_ID_NUM });
      toast({ title: "Switched to Sepolia", description: "You're now on the Sepolia testnet." });
      await refreshBalance();
    } catch (err: any) {
      console.error("Failed to switch network:", err);
      toast({
        title: "Switch failed",
        description: err?.message || "Please switch to Sepolia manually in your wallet.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

const connectToEth = async () => {
    if (!walletAddress) return;
    await refreshBalance();
  };

const refreshBalance = async () => {
    if (!walletAddress) return;
    setLoadingBalance(true);
    try {
      if (chainId !== SEPOLIA_CHAIN_ID_NUM) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Sepolia to see your balance",
          duration: 3000,
        });
        setEthConnected(false);
        setEthBalance("0");
        setLoadingBalance(false);
        return;
      }

      await refetchBalance();
      if (balanceData) {
        setEthBalance(balanceData.formatted);
        setEthConnected(true);
      }
    } catch (err) {
      console.error("Failed to get balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  };

useEffect(() => {
    fetchData();
    if (walletAddress && chainId === SEPOLIA_CHAIN_ID_NUM) {
      setEthConnected(true);
      refetchBalance();
    }
  }, [profile?.currentOrganization?.id, profile?.walletAddress, chainId]);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        if (data.ethereum?.usd) {
          setEthPrice(data.ethereum.usd);
        }
      } catch (err) {
        console.error("Failed to fetch ETH price:", err);
      }
    };
    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOwner && profile?.walletAddress) {
      const fetchTotalReceived = async () => {
        setLoadingTotalReceived(true);
        try {
          const txHistory = await ethereumService.getTransactionHistory(profile.walletAddress.toLowerCase(), 50);
          const total = txHistory.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
          setTotalReceived(formatCurrency(total * 100));
        } catch (err) {
          console.error("Failed to fetch transaction history:", err);
          setTotalReceived("$0.00");
        } finally {
          setLoadingTotalReceived(false);
        }
      };
      fetchTotalReceived();
    }
  }, [isOwner, profile?.walletAddress]);

const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    const member = availableMembers.find(m => m.id === memberId);
    if (member) {
      setEmployeeForm({
        name: "",
        wallet_address: member.user_id || "",
        position: member.role || "staff",
        department: "",
        salary: "",
      });
    }
  };

  const handleAddEmployee = async () => {
    if (!profile?.currentOrganization?.id) return;

    setSavingEmployee(true);
    try {
const { error } = await supabase
      .from("employees")
      .insert({
        organization_id: profile.currentOrganization.id,
        wallet_address: employeeForm.wallet_address,
        name: employeeForm.name || null,
        position: employeeForm.position || null,
        department: employeeForm.department || null,
        encrypted_salary: employeeForm.salary,
        status: "active",
      });

    if (error) throw error;

    toast({ title: "Employee Added", description: "Employee has been added to payroll" });
    setShowAddDialog(false);
    setEmployeeForm({ name: "", wallet_address: "", position: "", department: "", salary: "" });
      setSelectedMemberId("");
      fetchData();
    } catch (err) {
      console.error("Error adding employee:", err);
      toast({ title: "Error", description: "Failed to add employee", variant: "destructive" });
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!editingEmployee || !profile?.currentOrganization?.id) return;

    setSavingEmployee(true);
    try {
      const { error } = await supabase
        .from("employees")
        .update({
          name: employeeForm.name || null,
          position: employeeForm.position || null,
          department: employeeForm.department || null,
          encrypted_salary: employeeForm.salary,
        })
        .eq("id", editingEmployee.id);

      if (error) throw error;

      toast({ title: "Employee Updated", description: "Employee details have been updated" });
      setShowEditDialog(false);
      setEditingEmployee(null);
      setEmployeeForm({ name: "", wallet_address: "", position: "", department: "", salary: "" });
      fetchData();
    } catch (err) {
      console.error("Error updating employee:", err);
      toast({ title: "Error", description: "Failed to update employee", variant: "destructive" });
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm("Remove from payroll? Employee will stay in organization but with $0 salary.")) return;

    try {
      // Set salary to 0 instead of deleting - keeps them in org
      const { error } = await supabase
        .from("employees")
        .update({ encrypted_salary: "0" })
        .eq("id", employeeId);

      if (error) throw error;

      toast({ title: "Removed from Payroll", description: "Employee kept in organization with $0 salary" });
      fetchData();
    } catch (err) {
      console.error("Error deleting employee:", err);
      toast({ title: "Error", description: "Failed to remove employee", variant: "destructive" });
    }
  };

  const openEditDialog = (employee: EmployeeRow) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: (employee as any).name || "",
      wallet_address: employee.wallet_address,
      position: employee.position || "",
      department: employee.department || "",
      salary: employee.encrypted_salary || "",
    });
    setShowEditDialog(true);
  };

const handleProcessPayroll = async () => {
    if (employees.length === 0) return;
    if (!walletClient) {
      toast({ title: "Wallet not connected", description: "Please connect your wallet to process payroll", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      // Initialize ethereum service with walletClient signer
      await ethereumService.initializeWithSigner(walletClient);

      const employeesToPay = employees
        .filter(e => Number(e.encrypted_salary) > 0)
        .map(e => ({
          address: e.wallet_address,
          salary: Number(e.encrypted_salary) / 100,
        }));

      if (employeesToPay.length === 0) {
        toast({ title: "No employees to pay", description: "All employees have $0 salary", variant: "destructive" });
        setProcessing(false);
      return;
    }

    const result = await ethereumService.processPayroll(
      employeesToPay,
      (current, total, hash) => {
        if (hash) {
          toast({
            title: "Payment Sent",
            description: `Sent to employee ${current}/${total}`,
          });
        }
      }
    );

    toast({
      title: "Payroll Processed",
      description: `Sent ${formatCurrency(Number(result.totalAmount))} to ${result.txHashes.length} employees`,
    });
  } catch (err) {
    console.error("Error processing payroll:", err);
    toast({ title: "Error", description: "Failed to process payroll. Make sure you're on Sepolia and have enough ETH.", variant: "destructive" });
  } finally {
    setProcessing(false);
  }
};

const handleWithdraw = async () => {
  if (!amount || !recipient) return;
  if (!walletClient) {
    toast({ title: "Error", description: "Please connect your wallet to withdraw", variant: "destructive" });
    return;
  }

  setProcessing(true);
  try {
    const initResult = await ethereumService.initializeWithSigner(walletClient);
    if (!initResult) {
      throw new Error("Failed to initialize wallet");
    }
    const txHash = await ethereumService.sendTransaction(
      recipient,
      amount
    );

    toast({
      title: "Withdrawal Complete",
      description: `Sent ${amount} ETH to ${recipient.slice(0, 6)}...${recipient.slice(-4)}. Tx: ${txHash.slice(0, 10)}...`,
    });
    setAmount("");
    setRecipient("");
    try {
      await refreshBalance();
    } catch (e) {
      console.log("Balance refresh failed, but transaction succeeded");
    }
  } catch (err: any) {
    console.error("Error withdrawing:", err);
    const errorMsg = err?.message || "Failed to withdraw";
    toast({ title: "Error", description: errorMsg, variant: "destructive" });
  } finally {
    setProcessing(false);
  }
};

  const totalPayroll = employees.reduce((sum, e) => {
    const sal = e.encrypted_salary;
    const bonus = (e as any).bonus || 0;
    return sum + (Number(sal) || 0) + bonus;
  }, 0);

  const openAddDialog = () => {
    setSelectedMemberId("");
    setEmployeeForm({ name: "", wallet_address: "", position: "", department: "", salary: "" });
    setShowAddDialog(true);
  };

  if (!profile?.currentOrganization) {
    return <div className="p-6">No organization found</div>;
  }

  return (
    <div className="space-y-6">
      {chainId !== SEPOLIA_CHAIN_ID_NUM && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Wrong Network Detected</p>
            <p className="text-sm">Please switch to Sepolia network to use payroll features.</p>
          </div>
          <Button
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            onClick={handleSwitchToSepolia}
          >
            Switch to Sepolia
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage payroll and employee compensation</p>
        </div>
        {isOwner && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openAddDialog}>
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Employee to Payroll</DialogTitle>
                <DialogDescription>
                  Select a member who has joined via invite code or email invitation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {availableMembers.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <Label>Select Member</Label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        value={selectedMemberId}
                        onChange={(e) => handleMemberSelect(e.target.value)}
                      >
                        <option value="">-- Select a member --</option>
                        {availableMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.user_id?.slice(0, 10)}...{member.user_id?.slice(-4)} ({member.role})
                          </option>
                        ))}
</select>
</div>

<div className="space-y-2">
  <Label>Name</Label>
  <Input
    placeholder="John Doe"
    value={employeeForm.name}
    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
  />
</div>
<div className="space-y-2">
  <Label>Wallet Address</Label>
  <Input
    placeholder="0x..."
    value={employeeForm.wallet_address}
    onChange={(e) => setEmployeeForm({ ...employeeForm, wallet_address: e.target.value })}
  />
</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          placeholder="Software Engineer"
                          value={employeeForm.position}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input
                          placeholder="Engineering"
                          value={employeeForm.department}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Salary (USD)</Label>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={employeeForm.salary}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No members available to add.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Employees must join via invite code or email invitation first.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button 
                  onClick={handleAddEmployee} 
                  disabled={savingEmployee || !employeeForm.wallet_address || !employeeForm.salary || availableMembers.length === 0}
                >
                  {savingEmployee ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Payroll"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className={isOwner ? "bg-gradient-to-br from-green-500 to-green-600 text-white" : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isOwner ? "Total Payroll" : "Your Salary"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isOwner ? (
              <>
                <div className="text-3xl font-bold">{formatCurrency(totalPayroll)}</div>
                <p className="text-xs opacity-75 mt-1">
                  {employees.length} employee{employees.length !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">{ownSalary}</div>
                <p className="text-xs opacity-75 mt-1">USDC/month</p>
              </>
            )}
          </CardContent>
        </Card>

<Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {isOwner ? "Organization Wallet" : "My Wallet"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-mono truncate">
                {profile.walletAddress?.slice(0, 10)}...{profile.walletAddress?.slice(-4)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {profile.currentRole}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 h-7 px-2"
                  onClick={ethConnected ? refreshBalance : connectToEth}
                  disabled={loadingBalance}
                >
                {loadingBalance ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-1 text-xs">
                  {balanceData ? parseFloat(balanceData.formatted).toFixed(4) : parseFloat(ethBalance).toFixed(4)} ETH
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {!isOwner && (
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Total Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTotalReceived ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{totalReceived}</div>
                  <p className="text-xs opacity-75 mt-1">From payroll</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isOwner && (
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Employee Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{employees.length}</div>
              <p className="text-xs opacity-75 mt-1">Active employees</p>
            </CardContent>
          </Card>
        )}
      </div>

      {isOwner && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Management
              </CardTitle>
              <CardDescription>Manage employees in payroll</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No employees in payroll yet</p>
                  <Button onClick={openAddDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Employee
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {employees.map((emp) => (
<div key={emp.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium flex items-center gap-2">
                {(emp as any).name || emp.wallet_address?.slice(0, 8) + "..." + emp.wallet_address?.slice(-4)}
                <Badge variant="secondary" className="text-xs">{emp.status}</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                {emp.position || "Staff"} {emp.department && `• ${emp.department}`}
              </p>
            </div>
          </div>
<div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(emp.encrypted_salary || 0) + ((emp as any).bonus || 0))}</p>
                        <p className="text-xs text-muted-foreground">
{formatCurrency(Number(emp.encrypted_salary || 0))} salary
                  {((emp as any).bonus || 0) > 0 && <span className="text-green-600"> + {formatCurrency((emp as any).bonus || 0)} bonus</span>}
                        </p>
                      </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(emp)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployee(emp.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Process Payroll
              </CardTitle>
              <CardDescription>
                Send payments to all active employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No employees with salary configured. Add employees first.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Employees to pay</span>
                      <Badge variant="default">{employees.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total amount</span>
                      <span className="text-xl font-bold">{formatCurrency(totalPayroll)}</span>
                    </div>
                  </div>

                  {processing && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-medium">Processing Payments...</span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleProcessPayroll}
                    disabled={processing}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {processing ? "Processing Payments..." : "Process Payroll"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              Withdraw Funds
            </CardTitle>
            <CardDescription>
              Withdraw your salary to your wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {(() => {
                  const eth = balanceData ? parseFloat(balanceData.formatted) : parseFloat(ethBalance);
                  const usd = eth * ethPrice;
                  return `$${usd.toFixed(2)}`;
                })()}
                <Badge variant="default" className="text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Available
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (ETH)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!recipient || !amount || processing}
              onClick={handleWithdraw}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
              {processing ? "Processing..." : "Withdraw"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Employee Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details and salary</DialogDescription>
          </DialogHeader>
<div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="John Doe"
              value={employeeForm.name}
              onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <Input
              placeholder="0x..."
              value={employeeForm.wallet_address}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                placeholder="Software Engineer"
                value={employeeForm.position}
                onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                placeholder="Engineering"
                value={employeeForm.department}
                onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Monthly Salary (USD)</Label>
            <Input
              type="number"
              placeholder="5000"
              value={employeeForm.salary}
              onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditEmployee} disabled={savingEmployee || !employeeForm.salary}>
              {savingEmployee ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;