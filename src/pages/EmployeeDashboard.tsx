import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "@/hooks/useTranslation";
import { DollarSign, Users, Wallet, History, Loader2, TrendingUp, Calendar, ArrowUpRight, BarChart3, User, Edit, ExternalLink } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

interface PaymentData {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  tx_hash?: string | null;
}

const EmployeeDashboard = () => {
  const { profile } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { t } = useTranslation();
  const isOwner = profile?.currentRole === "owner";
  const isManager = profile?.currentRole === "manager";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [members, setMembers] = useState<UserRole[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [editNameForm, setEditNameForm] = useState({ name: "", position: "" });
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    console.log("Debug - isOwner:", isOwner, "role:", profile?.currentRole, "hasEmployee:", !!employee);
  }, [isOwner, profile?.currentRole, employee]);

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

        // Get bonuses for calculating total
        const { data: bonusData } = await supabase
          .from("bonuses")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);
        
        if (bonusData) setBonuses(bonusData);

        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);

        if (roleError) throw roleError;
        setMembers(roleData || []);

        // Find current user's employee record - lowercase comparison
        const currentUserEmployee = (empData || []).find(
          e => e.wallet_address?.toLowerCase() === profile?.walletAddress?.toLowerCase()
        );
        
        setEmployee(currentUserEmployee || null);

        if ((isOwner || isManager) && activeEmployees.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(activeEmployees[0].id);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.currentOrganization?.id, isOwner, isManager, walletAddress]);

  useEffect(() => {
    // For owners, still allow fetching employee-specific data when selected
    const fetchEmployeeData = async () => {
      if (!selectedEmployeeId) {
        if (!isOwner) {
          setEmployee(null);
          setPayments([]);
        }
        return;
      }

      try {
        const emp = employees.find(e => e.id === selectedEmployeeId);
        if (emp) {
          setEmployee(emp);

          const { data: payData, error: payError } = await (supabase as any)
            .from("payments")
            .select("*")
            .eq("employee_id", emp.id)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!payError && payData) {
            setPayments(payData.map((p: any) => ({
              id: p.id,
              amount: Number(p.amount),
              type: p.payment_type || "salary",
              status: p.status || "pending",
              created_at: p.created_at
            })));
          }
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
      }
    };

    fetchEmployeeData();
  }, [selectedEmployeeId, employees, isOwner]);

  const getMemberRole = (walletAddress: string) => {
    const member = members.find(m => m.user_id?.toLowerCase() === walletAddress?.toLowerCase());
    return member?.role || "staff";
  };

  const getEmployeeName = (emp: Employee) => {
    return (emp as any).name || emp.wallet_address?.slice(0, 8) + "..." + emp.wallet_address?.slice(-4);
  };

  const handleSaveName = async () => {
    if (!employee) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("employees")
        .update({
          name: editNameForm.name || null,
          position: editNameForm.position || null
        })
        .eq("id", employee.id);
      
      if (error) throw error;
      
      setEmployee({ ...employee, name: editNameForm.name, position: editNameForm.position });
      setEditingName(false);
    } catch (err) {
      console.error("Failed to update name:", err);
    } finally {
      setSavingName(false);
    }
  };

  const totalReceived = payments.reduce((sum, p) => sum + (p.status === "completed" ? p.amount : 0), 0);
  const monthlyCount = payments.filter(p => p.status === "completed").length;
  const maxPayment = Math.max(...payments.map(p => p.amount), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

if (!isOwner) {
  const employeeName = employee ? ((employee as any).name || employee.wallet_address?.slice(0, 10) + "..." + employee.wallet_address?.slice(-4)) : walletAddress?.slice(0, 10) + "..." + walletAddress?.slice(-4);
  const employeeBonus = employee ? bonuses.filter(b => b.employee_id === employee.id).reduce((sum, b) => sum + Number(b.amount), 0) : 0;
  const totalSalary = employee ? Number(employee.encrypted_salary || 0) + employeeBonus : 0;
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground text-lg mt-1">View your salary and payment history</p>
      </div>

      

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">{getMemberRole(walletAddress || "")}</p>
              <p className="text-muted-foreground font-mono">
                {walletAddress?.slice(0, 12)}...{walletAddress?.slice(-4)}
              </p>
            </div>
          </div>

          {employee ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
                <p className="text-sm opacity-90">Position</p>
                <p className="text-xl font-semibold">{employee.position || "Staff"}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg">
                <p className="text-sm opacity-90">Department</p>
                <p className="text-xl font-semibold">{employee.department || "General"}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg">
                <p className="text-sm opacity-90">Monthly Salary</p>
                <p className="text-xl font-semibold">{formatCurrency(Number(employee.encrypted_salary || 0) + employeeBonus)}</p>
                <p className="text-xs opacity-75">incl. bonus</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg">
                <p className="text-sm opacity-90">Status</p>
                <Badge variant="secondary" className="mt-1 bg-white/20 text-white border-0">{employee.status}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              You are in the organization but not yet added to payroll.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Employee Analytics</h1>
        <p className="text-muted-foreground text-lg mt-1">View employee details, payments and history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Employee
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-muted-foreground text-lg py-4">No employees in payroll yet.</p>
          ) : (
            <select
              className="w-full h-14 px-4 border-2 border-input rounded-lg bg-background text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">-- Select an employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {getEmployeeName(emp)} - {emp.position || "Staff"} - {formatCurrency(Number(emp.encrypted_salary || 0))}/mo
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {employee && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monthly Salary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(Number(employee.encrypted_salary || 0))}</div>
                <p className="text-xs opacity-75 mt-1">per month</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(totalReceived)}</div>
                <p className="text-xs opacity-75 mt-1">all time</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Payments Made
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{monthlyCount}</div>
                <p className="text-xs opacity-75 mt-1">completed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Avg Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(monthlyCount > 0 ? Math.round(totalReceived / monthlyCount) : 0)}</div>
                <p className="text-xs opacity-75 mt-1">per transaction</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold text-lg">{(employee as any).name || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant="outline" className="text-lg">{getMemberRole(employee.wallet_address)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={employee.status === "active" ? "default" : "secondary"} className="text-lg">
                      {employee.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                <p className="font-mono text-lg">{employee.wallet_address}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Payment Chart
              </CardTitle>
              <CardDescription>Real blockchain transactions from Sepolia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwner && payments.length === 0 ? (
                <div className="h-64 flex items-end justify-around gap-2 px-4 py-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                      <div 
                        className="w-full rounded-t-lg bg-gray-200"
                        style={{ height: "20px" }}
                        title="No transactions"
                      />
                      <span className="text-xs text-muted-foreground">--</span>
                    </div>
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No payment history</p>
              ) : (
                <div className="h-64 flex items-end justify-around gap-2 px-4 py-4">
                  {payments.slice(0, 12).reverse().map((payment, index) => (
                    <div key={payment.id} className="flex flex-col items-center gap-2 flex-1">
                      <div 
                        className={`w-full rounded-t-lg transition-all hover:opacity-80 ${payment.status === "completed" ? "bg-green-500" : "bg-yellow-500"}`}
                        style={{ 
                          height: `${Math.max((payment.amount / maxPayment) * 200, 20)}px`,
                          minHeight: "20px"
                        }}
                        title={`${formatCurrency(payment.amount)} - ${payment.status}`}
                      />
                      <span className="text-xs text-muted-foreground transform -rotate-45 origin-left whitespace-nowrap">
                        {new Date(payment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>Recent payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No payment history</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${payment.status === "completed" ? "bg-green-100" : "bg-yellow-100"}`}>
                          {payment.status === "completed" ? (
                            <ArrowUpRight className="h-6 w-6 text-green-600" />
                          ) : (
                            <Calendar className="h-6 w-6 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-lg capitalize">{payment.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-2xl">{formatCurrency(payment.amount)}</p>
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedEmployeeId && employees.length > 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">Select an employee to view analytics</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editingName} onOpenChange={setEditingName}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Your Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editNameForm.name}
                onChange={(e) => setEditNameForm({ ...editNameForm, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                value={editNameForm.position}
                onChange={(e) => setEditNameForm({ ...editNameForm, position: e.target.value })}
                placeholder="Your position"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingName(false)}>Cancel</Button>
            <Button onClick={handleSaveName} disabled={savingName}>
              {savingName ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDashboard;