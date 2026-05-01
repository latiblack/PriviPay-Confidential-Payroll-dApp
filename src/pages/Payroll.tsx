import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/currency";
import { Users, DollarSign, Loader2, CheckCircle } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

const PayrollPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isOwner = profile?.currentRole === "owner";
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!profile?.currentOrganization?.id) return;

      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .eq("status", "active");

        if (error) throw error;
        setEmployees(data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [profile?.currentOrganization?.id]);

  const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.encrypted_salary) || 0), 0);

  const handlePayEmployee = async (employeeId: string) => {
    setProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from("payments")
        .insert({
          employee_id: employeeId,
          amount: "5000",
          payment_type: "salary",
          status: "completed",
        });

      if (error) throw error;

      toast({
        title: "Payment Processed",
        description: "Salary payment completed successfully",
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to process payment", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handlePayAll = async () => {
    setProcessing(true);
    try {
      for (const emp of employees) {
        await (supabase as any).from("payments").insert({
          employee_id: emp.id,
          amount: emp.encrypted_salary || "0",
          payment_type: "salary",
          status: "completed",
        });
      }

      toast({
        title: "Payroll Complete",
        description: `Processed payments for ${employees.length} employees`,
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to process payroll", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (!isOwner) {
    return <div className="p-6">Access denied. Only owners can view this page.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Process salary payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalPayroll)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">Ready</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No active employees</p>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{emp.position || "Staff"}</p>
                      <p className="text-sm text-muted-foreground">
                        {emp.wallet_address?.slice(0, 10)}...{emp.wallet_address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(emp.encrypted_salary || 0))}</p>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>
                    <Button 
                      onClick={() => handlePayEmployee(emp.id)} 
                      disabled={processing}
                      variant="outline"
                      size="sm"
                    >
                      <DollarSign className="h-4 w-4" /> Pay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {employees.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Total Payroll</p>
                  <p className="text-sm text-muted-foreground">Process all employees at once</p>
                </div>
                <Button onClick={handlePayAll} disabled={processing} size="lg">
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Pay All ({formatCurrency(totalPayroll)})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollPage;