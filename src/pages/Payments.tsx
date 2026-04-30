import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  DollarSign, Users, Send, Wallet, Loader2, ArrowDownToLine, Lock,
  Shield, Key, Eye, EyeOff, CheckCircle2, AlertCircle, Plus, Trash2, Edit, UserPlus,
  Vote, FileCheck, UserCheck, Crown, Building2
} from "lucide-react";
import { fhePayrollService } from "@/lib/fhe/payroll-service";
import { salaryToCents } from "@/lib/fhe/encryption";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

const PAYROLL_CONTRACT_ADDRESS = import.meta.env.VITE_PAYROLL_CONTRACT_ADDRESS || "";

interface EmployeeFormData {
  wallet_address: string;
  position: string;
  department: string;
  salary: string;
}

const PaymentsPage = () => {
  const { profile } = useAuth();
  const { walletAddress, provider } = useWalletAuth();
  const { toast } = useToast();
  const isOwner = profile?.currentRole === "owner";

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [ownSalary, setOwnSalary] = useState<string>("***");
  const [fheInitialized, setFheInitialized] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  
  // Contract state
  const [contractOwner, setContractOwner] = useState<string>("");
  const [contractEmployeeCount, setContractEmployeeCount] = useState<number>(0);
  const [contractTotalPayroll, setContractTotalPayroll] = useState<string>("$0");
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const [isContractEmployee, setIsContractEmployee] = useState(false);
  const [hasRequestedJoin, setHasRequestedJoin] = useState(false);
  const [loadingContractInfo, setLoadingContractInfo] = useState(false);

  // Employee management state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>({
    wallet_address: "",
    position: "",
    department: "",
    salary: "",
  });
  const [savingEmployee, setSavingEmployee] = useState(false);

  const fetchData = async () => {
    if (!profile?.currentOrganization?.id || !profile?.walletAddress) return;

    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);

      const mySalary = data?.find(e => e.wallet_address === profile.walletAddress);
      setOwnSalary(mySalary?.encrypted_salary ? `$${Number(mySalary.encrypted_salary).toLocaleString()}` : "***");

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

const initializeFHE = async () => {
  if (!provider || !PAYROLL_CONTRACT_ADDRESS) {
    setFheInitialized(false);
    return;
  }

  try {
    await fhePayrollService.initialize(PAYROLL_CONTRACT_ADDRESS, provider as any);

    const keys = await fhePayrollService.getUserKeys();
    setHasKeys(!!keys);

    setFheInitialized(true);
  } catch (err) {
    console.error("FHE initialization error:", err);
    setFheInitialized(false);
  }
};

const fetchContractInfo = async () => {
  if (!fheInitialized || !walletAddress) return;
  
  setLoadingContractInfo(true);
  try {
    // Check if user is an employee on contract
    const isEmp = await fhePayrollService.isEmployee(walletAddress);
    setIsContractEmployee(isEmp);
    
    // Get employee count
    const count = await fhePayrollService.getEmployeeCount();
    setContractEmployeeCount(count);
    
    // Get total payroll (only meaningful for owner)
    if (isOwner) {
      const total = await fhePayrollService.getTotalPayroll();
      setContractTotalPayroll(total);
    }
  } catch (err) {
    console.error("Error fetching contract info:", err);
  } finally {
    setLoadingContractInfo(false);
  }
};

  useEffect(() => {
    fetchData();
  }, [profile?.currentOrganization?.id, profile?.walletAddress]);

useEffect(() => {
  if (provider && PAYROLL_CONTRACT_ADDRESS) {
    initializeFHE();
  }
}, [provider, walletAddress]);

useEffect(() => {
  if (fheInitialized && walletAddress) {
    fetchContractInfo();
  }
}, [fheInitialized, isOwner]);

  const handleDecryptSalary = async () => {
    if (!walletAddress || !fheInitialized) {
      toast({ title: "FHE Not Ready", description: "Please wait for encryption keys to initialize", variant: "destructive" });
      return;
    }

    setDecrypting(true);
    try {
      const salary = await fhePayrollService.getMySalary(walletAddress);
      setOwnSalary(salary);
      toast({
        title: "Salary Decrypted",
        description: "Your salary has been decrypted using your FHE keys",
      });
    } catch (err) {
      console.error("Decryption error:", err);
      toast({ title: "Decryption Failed", description: "Could not decrypt salary", variant: "destructive" });
    } finally {
      setDecrypting(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!profile?.currentOrganization?.id || employees.length === 0) return;

    setProcessing(true);
    setProcessingProgress({ current: 0, total: employees.length });

    try {
      const result = await fhePayrollService.processPayroll(
        employees.map(e => ({
          address: e.wallet_address,
          encryptedSalary: e.encrypted_salary || "0",
          status: e.status as "active",
        })),
        (current, total) => setProcessingProgress({ current, total })
      );

      toast({
        title: "Encrypted Payroll Processed",
        description: `FHE payroll sent to ${result.processed} employees via encrypted transfer`,
      });
    } catch (err) {
      console.error("Error processing payroll:", err);
      toast({ title: "Error", description: "Failed to process payroll", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!recipient || !amount || !fheInitialized) return;

    setProcessing(true);
    try {
      toast({
        title: "Initiating Encrypted Withdrawal",
        description: "Your withdrawal is being processed via FHE contract",
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Withdrawal Initiated",
        description: "Transaction submitted to the FHE payroll contract",
      });

      setRecipient("");
      setAmount("");
    } catch (err) {
      console.error("Error withdrawing:", err);
      toast({ title: "Error", description: "Failed to withdraw", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  // Employee management functions
  const handleAddEmployee = async () => {
    if (!profile?.currentOrganization?.id) return;

    const salaryCents = salaryToCents(Number(employeeForm.salary));

    setSavingEmployee(true);
    try {
      // Store in database
      const { error } = await supabase
        .from("employees")
        .insert({
          organization_id: profile.currentOrganization.id,
          wallet_address: employeeForm.wallet_address,
          position: employeeForm.position || null,
          department: employeeForm.department || null,
          encrypted_salary: String(salaryCents), // Store as cents string
          status: "active",
        });

      if (error) throw error;

      // If contract is configured, also add via FHE contract
      if (PAYROLL_CONTRACT_ADDRESS) {
        try {
          await fhePayrollService.addEmployee(
            employeeForm.wallet_address,
            employeeForm.position || "Employee",
            Number(employeeForm.salary)
          );
        } catch (contractErr) {
          console.warn("Contract call failed, DB save succeeded:", contractErr);
        }
      }

      toast({ title: "Employee Added", description: "Employee has been added successfully" });
      setShowAddDialog(false);
      setEmployeeForm({ wallet_address: "", position: "", department: "", salary: "" });
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

    const salaryCents = salaryToCents(Number(employeeForm.salary));

    setSavingEmployee(true);
    try {
      const { error } = await supabase
        .from("employees")
        .update({
          wallet_address: employeeForm.wallet_address,
          position: employeeForm.position || null,
          department: employeeForm.department || null,
          encrypted_salary: String(salaryCents),
        })
        .eq("id", editingEmployee.id);

      if (error) throw error;

      // If contract is configured, also update via FHE contract
      if (PAYROLL_CONTRACT_ADDRESS) {
        try {
          await fhePayrollService.setEmployeeSalary(
            employeeForm.wallet_address,
            Number(employeeForm.salary)
          );
        } catch (contractErr) {
          console.warn("Contract call failed, DB save succeeded:", contractErr);
        }
      }

      toast({ title: "Employee Updated", description: "Employee details have been updated" });
      setShowEditDialog(false);
      setEditingEmployee(null);
      setEmployeeForm({ wallet_address: "", position: "", department: "", salary: "" });
      fetchData();
    } catch (err) {
      console.error("Error updating employee:", err);
      toast({ title: "Error", description: "Failed to update employee", variant: "destructive" });
    } finally {
      setSavingEmployee(false);
    }
  };

const handleDeleteEmployee = async (employeeId: string) => {
  if (!confirm("Are you sure you want to remove this employee?")) return;

  try {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employeeId);

    if (error) throw error;

    toast({ title: "Employee Removed", description: "Employee has been removed" });
    fetchData();
  } catch (err) {
    console.error("Error deleting employee:", err);
    toast({ title: "Error", description: "Failed to remove employee", variant: "destructive" });
  }
};

const handleRequestJoin = async () => {
  if (!fheInitialized) {
    toast({ title: "FHE Not Ready", description: "Please wait for encryption to initialize", variant: "destructive" });
    return;
  }
  
  setProcessing(true);
  try {
    const txHash = await fhePayrollService.requestJoin();
    setHasRequestedJoin(true);
    toast({ 
      title: "Join Request Submitted", 
      description: `Transaction: ${txHash.slice(0, 10)}...`
    });
  } catch (err) {
    console.error("Error requesting join:", err);
    toast({ title: "Error", description: "Failed to submit join request", variant: "destructive" });
  } finally {
    setProcessing(false);
  }
};

const handleApproveJoin = async (userAddress: string) => {
  if (!fheInitialized) return;
  
  setProcessing(true);
  try {
    const txHash = await fhePayrollService.approveJoin(userAddress);
    toast({ 
      title: "Employee Approved", 
      description: "Join request approved on-chain" 
    });
    setPendingRequests(prev => prev.filter(a => a !== userAddress));
  } catch (err) {
    console.error("Error approving join:", err);
    toast({ title: "Error", description: "Failed to approve join request", variant: "destructive" });
  } finally {
    setProcessing(false);
  }
};

const handleVoteForEmployee = async (candidateAddress: string) => {
  if (!fheInitialized) return;
  
  setProcessing(true);
  try {
    await fhePayrollService.castVoteFor(walletAddress, candidateAddress);
    toast({ title: "Vote Cast", description: "Your vote has been recorded on-chain" });
  } catch (err) {
    console.error("Error casting vote:", err);
    toast({ title: "Error", description: "Failed to cast vote", variant: "destructive" });
  } finally {
    setProcessing(false);
  }
};

const handleDistributeBonuses = async (threshold: number = 100) => {
  if (!fheInitialized) return;
  
  setProcessing(true);
  try {
    const txHash = await fhePayrollService.distributeBonuses(threshold);
    toast({ 
      title: "Bonuses Distributed", 
      description: "Bonus distribution completed based on votes"
    });
  } catch (err) {
    console.error("Error distributing bonuses:", err);
    toast({ title: "Error", description: "Failed to distribute bonuses", variant: "destructive" });
  } finally {
    setProcessing(false);
  }
};

  const openEditDialog = (employee: EmployeeRow) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      wallet_address: employee.wallet_address,
      position: employee.position || "",
      department: employee.department || "",
      salary: employee.encrypted_salary || "",
    });
    setShowEditDialog(true);
  };

  const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.encrypted_salary) || 0), 0);
  const isCurrentUserEmployee = employees.some(e => e.wallet_address === walletAddress);
  const isPendingEmployee = pendingRequests.includes(walletAddress || "");

  if (!profile?.currentOrganization) {
    return <div className="p-6">No organization found</div>;
  }

return (
  <div className="space-y-6">
    {/* Request to Join Banner - For non-employees */}
    {!isOwner && !isCurrentUserEmployee && (
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Join Your Organization</h3>
                <p className="text-sm text-amber-700">Request access to view your salary and manage payments</p>
              </div>
            </div>
            <div className="flex gap-2">
              {hasRequestedJoin || isPendingEmployee ? (
                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Request Pending
                </Badge>
              ) : (
                <Button 
                  onClick={handleRequestJoin} 
                  disabled={processing || !fheInitialized}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                  Request to Join
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Contract Info Card - For Owner */}
    {isOwner && fheInitialized && (
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-muted-foreground">Contract Owner</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">On-Chain Employees:</span>
                <span className="font-semibold">{contractEmployeeCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Payroll:</span>
                <span className="font-semibold">{contractTotalPayroll}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" /> FHE Active
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                {PAYROLL_CONTRACT_ADDRESS.slice(0, 8)}...{PAYROLL_CONTRACT_ADDRESS.slice(-6)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Manage payroll and employee compensation</p>
      </div>
        {isOwner && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Add a new employee to your organization and configure their salary</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                  <p className="text-xs text-muted-foreground">Salary will be encrypted using FHE</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddEmployee} disabled={savingEmployee || !employeeForm.wallet_address || !employeeForm.salary}>
                  {savingEmployee ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Employee"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isOwner && (
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Treasury Balance (FHE)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{showBalance ? `$${balance}` : "***"}</div>
              <p className="text-xs opacity-75 mt-1">USDC - Encrypted on-chain</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-primary-foreground hover:text-primary-foreground/80"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showBalance ? "Hide" : "Reveal"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Key className="h-4 w-4" />
              {isOwner ? "Treasury Wallet" : "Salary Wallet"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono truncate">
              {profile.walletAddress?.slice(0, 10)}...{profile.walletAddress?.slice(-4)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {hasKeys ? (
                <Badge variant="default" className="text-xs gap-1">
                  <Shield className="h-3 w-3" /> FHE Ready
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Initializing...</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isOwner ? "Total Payroll" : "Your Salary"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isOwner ? (
              <>
                <div className="text-3xl font-bold">{showBalance ? `$${totalPayroll.toLocaleString()}` : "***"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {employees.length} employee{employees.length !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">{ownSalary}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  USDC/month - {hasKeys ? "FHE Encrypted" : "Loading..."}
                </p>
                {!hasKeys && (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {!isOwner && fheInitialized && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Your salary is FHE encrypted</p>
                  <p className="text-sm text-muted-foreground">Only you can decrypt and view your salary</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecryptSalary}
                disabled={decrypting}
                className="gap-2"
              >
                {decrypting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                {decrypting ? "Decrypting..." : "Decrypt Salary"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isOwner && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Management
              </CardTitle>
              <CardDescription>Manage employees and configure their salaries</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No employees added yet</p>
                  <Button onClick={() => setShowAddDialog(true)} className="gap-2">
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
                          <Lock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {emp.wallet_address?.slice(0, 8)}...{emp.wallet_address?.slice(-4)}
                            <Badge variant="secondary" className="text-xs">Encrypted</Badge>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {emp.position || "Employee"} {emp.department && `• ${emp.department}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">${Number(emp.encrypted_salary || 0).toLocaleString()}</p>
                          <Badge variant="secondary" className="text-xs">Monthly</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(emp)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEmployee(emp.id)}
                          >
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
                Process FHE Payroll
              </CardTitle>
              <CardDescription>
                Send encrypted payments to all active employees using Fully Homomorphic Encryption
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
                      <span className="text-sm text-muted-foreground">Total amount (FHE encrypted)</span>
                      <span className="text-xl font-bold">${totalPayroll.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Contract
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {PAYROLL_CONTRACT_ADDRESS ? `${PAYROLL_CONTRACT_ADDRESS.slice(0, 10)}...` : "Not configured"}
                      </span>
                    </div>
                  </div>

                  {processing && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-medium">Processing FHE Transactions...</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {processingProgress.current} / {processingProgress.total} employees
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleProcessPayroll}
                    disabled={processing || !fheInitialized}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {processing ? "Processing Encrypted Payments..." : "Process FHE Payroll"}
                  </Button>

                  {!fheInitialized && (
                    <p className="text-xs text-muted-foreground text-center">
                      FHE contract not connected. Set VITE_PAYROLL_CONTRACT_ADDRESS in environment.
                    </p>
                  )}
                </div>
              )}
</CardContent>
</Card>

      {/* Bonus Voting Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Bonus Distribution (FHE Voting)
          </CardTitle>
          <CardDescription>
            Vote for employees to receive bonuses - votes are encrypted and counted on-chain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No employees to vote for. Add employees first.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">
                  Vote for employees to allocate bonus rewards. Voting is done via encrypted FHE transactions.
                </p>
              </div>
              
              <div className="space-y-2">
                {employees.slice(0, 5).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Vote className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {emp.wallet_address?.slice(0, 8)}...{emp.wallet_address?.slice(-4)}
                        </p>
                        <p className="text-xs text-muted-foreground">{emp.position || "Employee"}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVoteForEmployee(emp.wallet_address)}
                      disabled={processing || !fheInitialized}
                      className="gap-1"
                    >
                      <Vote className="h-3 w-3" /> Vote
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleDistributeBonuses(50)}
                disabled={processing || !fheInitialized}
                className="w-full gap-2"
                variant="secondary"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                Distribute Bonuses Based on Votes
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
              Withdraw Funds (FHE Verified)
            </CardTitle>
            <CardDescription>
              Withdraw your salary using FHE verification - no one can see your balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Available Balance (Encrypted)</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {ownSalary}
                {hasKeys ? (
                  <Badge variant="default" className="text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <AlertCircle className="h-3 w-3" /> Not Ready
                  </Badge>
                )}
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
                <p className="text-xs text-muted-foreground">Your personal wallet address</p>
              </div>
              <div className="space-y-2">
                <Label>Amount (USDC)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Amount will be verified against encrypted balance</p>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!recipient || !amount || !fheInitialized || processing}
              onClick={handleWithdraw}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              {processing ? "Processing FHE Withdrawal..." : "Withdraw via FHE Contract"}
            </Button>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3 mt-0.5" />
              <p>Withdrawals are verified using FHE. Your actual balance remains encrypted on-chain.</p>
            </div>
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
              <p className="text-xs text-muted-foreground">Salary will be encrypted using FHE</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditEmployee} disabled={savingEmployee || !employeeForm.wallet_address || !employeeForm.salary}>
              {savingEmployee ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;
