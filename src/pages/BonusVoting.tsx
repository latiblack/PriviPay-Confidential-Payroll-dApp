import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/currency";
import { getAddress } from "viem";
import { encryptUint64, setBonus as setContractBonus } from "@/lib/fhe";
import { useWalletClient, useAccount, useSwitchChain } from "wagmi";
import { DollarSign, Users, Loader2, Plus, Gift, Calendar, Trash2, CheckCircle, XCircle, Send } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

interface Bonus {
  id: string;
  employee_id: string;
  amount: number;
  month: string;
  created_at: string;
}

interface BonusRequest {
  id: string;
  employee_id: string;
  requested_by_wallet: string;
  amount: number;
  month: string;
  status: string;
  created_at: string;
}

const BonusPage = () => {
  const { profile } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { data: walletClient } = useWalletClient();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const isOwner = profile?.currentRole === "owner";
  const isManager = profile?.currentRole === "manager";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [bonusRequests, setBonusRequests] = useState<BonusRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusMonth, setBonusMonth] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.currentOrganization?.id) return;

      try {
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .eq("status", "active");

        if (empError) throw empError;
        
        const activeEmployees = (empData || []).filter(e => Number(e.encrypted_salary) > 0);
        setEmployees(activeEmployees);

        const { data: bonusData, error: bonusError } = await supabase
          .from("bonuses")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .order("created_at", { ascending: false });

        if (bonusError) throw bonusError;
        setBonuses(bonusData || []);

        // Get bonus requests for owner
        if (isOwner) {
          const { data: requestData, error: requestError } = await supabase
            .from("bonus_requests")
            .select("*")
            .eq("organization_id", profile.currentOrganization.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          if (!requestError) {
            setBonusRequests(requestData || []);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.currentOrganization?.id, isOwner]);

  const getEmployeeName = (emp: Employee) => {
    return (emp as any).name || emp.wallet_address?.slice(0, 8) + "..." + emp.wallet_address?.slice(-4);
  };

  const getEmployeeBonus = (employeeId: string) => {
    return bonuses
      .filter(b => b.employee_id === employeeId)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const getEmployee = (employeeId: string) => {
    return employees.find(e => e.id === employeeId);
  };

  const SEPOLIA_CHAIN_ID = 11155111;

  const setBonusOnChain = async (employeeId: string, amountUsd: string): Promise<boolean> => {
    const rawAddress = (profile?.currentOrganization as any)?.contract_address;
    if (!walletClient || !rawAddress) {
      console.warn("No wallet or contract — cannot set bonus on-chain");
      return false;
    }

    let orgContractAddress: `0x${string}`;
    try {
      orgContractAddress = getAddress(rawAddress);
    } catch {
      console.warn("Invalid contract address — cannot set bonus on-chain");
      return false;
    }

    if (chainId !== SEPOLIA_CHAIN_ID) {
      try {
        await switchChain({ chainId: SEPOLIA_CHAIN_ID });
      } catch {
        console.warn("Could not switch to Sepolia — cannot set bonus on-chain");
        return false;
      }
    }

    try {
      const emp = getEmployee(employeeId);
      if (!emp?.wallet_address) return false;
      const employeeAddress = getAddress(emp.wallet_address);

      const amountInCents = Math.round(parseFloat(amountUsd) * 100);
      const encrypted = await encryptUint64(amountInCents, orgContractAddress, walletAddress!);

      const txHash = await setContractBonus(
        walletClient,
        orgContractAddress,
        employeeAddress,
        encrypted.handle,
        encrypted.inputProof
      );
      console.log("setBonus on-chain tx:", txHash);
      return true;
    } catch (err) {
      console.error("Failed to set bonus on-chain:", err);
      return false;
    }
  };

  const handleAddBonus = async () => {
    if (!profile?.currentOrganization?.id || !selectedEmployeeId || !bonusAmount || !bonusMonth) return;

    setSaving(true);
    try {
      // 1. Set bonus on-chain first
      const onChainSuccess = await setBonusOnChain(selectedEmployeeId, bonusAmount);
      if (!onChainSuccess) {
        toast({ title: "Failed", description: "Could not set bonus on-chain. Please try again.", variant: "destructive" });
        return;
      }

      // 2. Save to DB after on-chain success
      const { error } = await supabase
        .from("bonuses")
        .insert({
          organization_id: profile.currentOrganization.id,
          employee_id: selectedEmployeeId,
          amount: Number(bonusAmount),
          month: bonusMonth,
        });

      if (error) throw error;

      // Get employee for notification
      const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
      const employeeName = selectedEmployee ? ((selectedEmployee as any).name || selectedEmployee.wallet_address?.slice(0, 10)) : "Employee";

      // Create notification
      await supabase.from("notifications").insert({
        organization_id: profile.currentOrganization.id,
        type: "bonus",
        title: "Bonus Received!",
        message: `You have received a bonus of ${formatCurrency(Number(bonusAmount))} for ${bonusMonth}`,
        user_id: selectedEmployee?.wallet_address,
        read: false,
      });

      toast({ title: "Bonus Added", description: `Bonus of ${formatCurrency(Number(bonusAmount))} added for ${bonusMonth}` });
      
      const { data } = await supabase
        .from("bonuses")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id)
        .order("created_at", { ascending: false });
      setBonuses(data || []);

      setShowAddDialog(false);
      setSelectedEmployeeId("");
      setBonusAmount("");
      setBonusMonth("");
    } catch (err) {
      console.error("Error adding bonus:", err);
      toast({ title: "Error", description: "Failed to add bonus", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestBonus = async () => {
    if (!profile?.currentOrganization?.id || !selectedEmployeeId || !bonusAmount || !bonusMonth) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bonus_requests")
        .insert({
          organization_id: profile.currentOrganization.id,
          employee_id: selectedEmployeeId,
          requested_by_wallet: walletAddress,
          amount: Number(bonusAmount),
          month: bonusMonth,
          status: "pending",
        });

      if (error) throw error;

      toast({ title: "Bonus Requested", description: `Request for ${formatCurrency(Number(bonusAmount))} bonus sent to owner` });
      
      setShowRequestDialog(false);
      setSelectedEmployeeId("");
      setBonusAmount("");
      setBonusMonth("");
    } catch (err) {
      console.error("Error requesting bonus:", err);
      toast({ title: "Error", description: "Failed to request bonus", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveRequest = async (request: BonusRequest) => {
    try {
      // 1. Set bonus on-chain first
      const onChainSuccess = await setBonusOnChain(request.employee_id, String(request.amount));
      if (!onChainSuccess) {
        toast({ title: "Failed", description: "Could not set bonus on-chain. Please try again.", variant: "destructive" });
        return;
      }

      // 2. Add the bonus to DB
      const { error } = await supabase
        .from("bonuses")
        .insert({
          organization_id: profile?.currentOrganization?.id,
          employee_id: request.employee_id,
          amount: request.amount,
          month: request.month,
        });

      if (error) throw error;

      // Update request status
      await supabase
        .from("bonus_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      // Create notification for the employee
      const emp = getEmployee(request.employee_id);
      if (emp) {
        await supabase.from("notifications").insert({
          organization_id: profile?.currentOrganization?.id,
          type: "bonus",
          title: "Bonus Approved!",
          message: `Your bonus request of ${formatCurrency(Number(request.amount))} for ${request.month} has been approved`,
          user_id: emp.wallet_address,
          read: false,
        });
      }

      toast({ title: "Bonus Approved", description: `Bonus of ${formatCurrency(Number(request.amount))} approved` });
      
      // Refresh
      const { data: reqData } = await supabase
        .from("bonus_requests")
        .select("*")
        .eq("organization_id", profile?.currentOrganization?.id)
        .eq("status", "pending");
      setBonusRequests(reqData || []);

      const { data: bonusData } = await supabase
        .from("bonuses")
        .select("*")
        .eq("organization_id", profile?.currentOrganization?.id)
        .order("created_at", { ascending: false });
      setBonuses(bonusData || []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to approve bonus", variant: "destructive" });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await supabase
        .from("bonus_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      toast({ title: "Request Rejected", description: "Bonus request has been rejected" });
      
      setBonusRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
    }
  };

  const handleDeleteBonus = async (bonusId: string) => {
    if (!confirm("Delete this bonus?")) return;

    try {
      const { error } = await supabase
        .from("bonuses")
        .delete()
        .eq("id", bonusId);

      if (error) throw error;

      setBonuses(prev => prev.filter(b => b.id !== bonusId));
      toast({ title: "Bonus Deleted", description: "Bonus has been removed" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete bonus", variant: "destructive" });
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);

  if (!profile?.currentOrganization) {
    return <div className="p-6">No organization found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bonus Management</h1>
          <p className="text-muted-foreground text-lg mt-1">Add monthly bonuses for employees</p>
        </div>
        {isOwner && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 text-lg px-6 py-4 relative z-50">
                <Plus className="h-5 w-5" />
                Add Bonus
              </Button>
            </DialogTrigger>
            <DialogContent className="z-[100]">
              <DialogHeader>
                <DialogTitle>Add Monthly Bonus</DialogTitle>
                <DialogDescription>Add bonus for an employee for a specific month</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <select
                    className="w-full p-3 border rounded-lg bg-background"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {getEmployeeName(emp)} - {formatCurrency(Number(emp.encrypted_salary || 0))}/mo
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Input
                    type="month"
                    value={bonusMonth || currentMonth}
                    onChange={(e) => setBonusMonth(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Amount (USD)</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleAddBonus}
                  disabled={saving || !selectedEmployeeId || !bonusAmount}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Bonus"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {isManager && (
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 text-lg px-6 py-4">
                <Send className="h-5 w-5" />
                Request Bonus
              </Button>
            </DialogTrigger>
            <DialogContent className="z-[100]">
              <DialogHeader>
                <DialogTitle>Request Bonus for Employee</DialogTitle>
                <DialogDescription>Request owner approval for employee bonus</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <select
                    className="w-full p-3 border rounded-lg bg-background"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {getEmployeeName(emp)} - {formatCurrency(Number(emp.encrypted_salary || 0))}/mo
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Input
                    type="month"
                    value={bonusMonth || currentMonth}
                    onChange={(e) => setBonusMonth(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Amount (USD)</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleRequestBonus}
                  disabled={saving || !selectedEmployeeId || !bonusAmount}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Bonus Requests for Owner */}
      {isOwner && bonusRequests.length > 0 && (
        <Card className="border-yellow-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Gift className="h-5 w-5" />
              Pending Bonus Requests
            </CardTitle>
            <CardDescription>Review and approve bonus requests from managers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bonusRequests.map((request) => {
                const emp = getEmployee(request.employee_id);
                return (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{emp ? getEmployeeName(emp) : "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(request.amount))} for {request.month}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested by: {request.requested_by_wallet?.slice(0, 10)}...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1 bg-green-600" onClick={() => handleApproveRequest(request)}>
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleRejectRequest(request.id)}>
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalBonuses)}</div>
            <p className="text-xs opacity-75 mt-1">all time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Bonuses This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(bonuses.filter(b => b.month === currentMonth).reduce((sum, b) => sum + b.amount, 0))}
            </div>
            <p className="text-xs opacity-75 mt-1">{currentMonth}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees with Bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(bonuses.map(b => b.employee_id)).size}
            </div>
            <p className="text-xs opacity-75 mt-1">unique employees</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Employee Bonuses
          </CardTitle>
          <CardDescription>View and manage employee bonuses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-lg">No employees in payroll yet.</p>
          ) : (
            <div className="space-y-4">
              {employees.map((emp) => {
                const empBonus = getEmployeeBonus(emp.id);
                const empBonuses = bonuses.filter(b => b.employee_id === emp.id);
                
                return (
                  <div key={emp.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Gift className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{getEmployeeName(emp)}</p>
                          <p className="text-sm text-muted-foreground">
                            {emp.position || "Staff"} • {formatCurrency(Number(emp.encrypted_salary || 0))}/mo
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(empBonus)}</p>
                        <p className="text-xs text-muted-foreground">total bonus</p>
                      </div>
                    </div>
                    
                    {empBonuses.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Bonus History:</p>
                        <div className="flex flex-wrap gap-2">
                          {empBonuses.map((bonus) => (
                            <Badge key={bonus.id} variant="outline" className="flex items-center gap-2 px-3 py-1">
                              <Calendar className="h-3 w-3" />
                              {bonus.month}: {formatCurrency(bonus.amount)}
                              {isOwner && (
                                <button 
                                  onClick={() => handleDeleteBonus(bonus.id)}
                                  className="ml-1 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BonusPage;