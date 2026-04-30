import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DollarSign, Users, Wallet, History, Loader2, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

interface PaymentData {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

const EmployeeDashboard = () => {
  const { profile } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { toast } = useToast();
  const isOwner = profile?.currentRole === "owner";
  const isManager = profile?.currentRole === "manager";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [members, setMembers] = useState<UserRole[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.currentOrganization?.id) return;

      try {
        // Get all employees in payroll (salary > 0)
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .eq("status", "active");

        if (empError) throw empError;
        
        const activeEmployees = (empData || []).filter(e => Number(e.encrypted_salary) > 0);
        setEmployees(activeEmployees);

        // Get all members for dropdown
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);

        if (roleError) throw roleError;
        setMembers(roleData || []);

        // Auto-select first employee if owner/manager
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
  }, [profile?.currentOrganization?.id, isOwner, isManager]);

  // Fetch employee details and payments when selection changes
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!selectedEmployeeId) {
        setEmployee(null);
        setPayments([]);
        return;
      }

      try {
        const emp = employees.find(e => e.id === selectedEmployeeId);
        if (emp) {
          setEmployee(emp);

          // Get payment history
          const { data: payData, error: payError } = await supabase
            .from("payments")
            .select("*")
            .eq("employee_id", emp.id)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!payError && payData) {
            setPayments(payData.map(p => ({
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
  }, [selectedEmployeeId, employees]);

  // Get member role for display
  const getMemberRole = (walletAddress: string) => {
    const member = members.find(m => m.user_id?.toLowerCase() === walletAddress?.toLowerCase());
    return member?.role || "employee";
  };

  // Calculate stats
  const totalReceived = payments.reduce((sum, p) => sum + (p.status === "completed" ? p.amount : 0), 0);
  const monthlyCount = payments.filter(p => p.status === "completed").length;
  const avgPayment = monthlyCount > 0 ? totalReceived / monthlyCount : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show message if not owner/manager
  if (!isOwner && !isManager) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">View your salary and payment history</p>
        </div>

        {employees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium capitalize">{getMemberRole(walletAddress || "")}</p>
                  <p className="text-sm text-muted-foreground">
                    {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-4)}
                  </p>
                </div>
              </div>
              {employee ? (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="font-medium">{employee.position || "Employee"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{employee.department || "General"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Salary</p>
                    <p className="font-medium">${Number(employee.encrypted_salary || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="default">{employee.status}</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground mt-4">You are in the organization but not yet added to payroll.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Analytics</h1>
        <p className="text-muted-foreground">View employee details, payments and history</p>
      </div>

      {/* Employee Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Employee
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-muted-foreground">No employees in payroll yet.</p>
          ) : (
            <select
              className="w-full p-3 border rounded-md bg-background text-lg"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">-- Select an employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.wallet_address?.slice(0, 10)}...{emp.wallet_address?.slice(-4)} - {emp.position || "Employee"} - ${Number(emp.encrypted_salary || 0).toLocaleString()}/mo
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {employee && (
        <>
          {/* Employee Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monthly Salary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${Number(employee.encrypted_salary || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">per month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employee.position || "Employee"}</div>
                <p className="text-sm text-muted-foreground mt-1">{employee.department || "General"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalReceived.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">all time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Payments Made
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{monthlyCount}</div>
                <p className="text-xs text-muted-foreground mt-1">completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Address Card */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Address</p>
                  <p className="font-mono text-lg">{employee.wallet_address}</p>
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
            </CardContent>
          </Card>

          {/* Payment History */}
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
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === "completed" ? "bg-green-100" : "bg-yellow-100"}`}>
                          {payment.status === "completed" ? (
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{payment.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">${payment.amount.toLocaleString()}</p>
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
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Select an employee to view analytics</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeDashboard;