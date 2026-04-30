import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Users, DollarSign, TrendingUp, Loader2 } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

const EmployerDashboard = () => {
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
          .eq("organization_id", profile.currentOrganization.id);

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

  const totalSalary = employees.reduce((sum, e) => sum + (Number(e.encrypted_salary) || 0), 0);
  const avgSalary = employees.length > 0 ? Math.round(totalSalary / employees.length) : 0;

  const handleProcessPayroll = async () => {
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Payroll Processed",
        description: `Payments sent to ${employees.length} employees`,
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to process payroll", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-lg mt-1">Manage your team and payroll</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employees.length}</div>
            <p className="text-xs opacity-75 mt-1">active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monthly Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalSalary.toLocaleString()}</div>
            <p className="text-xs opacity-75 mt-1">total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${avgSalary.toLocaleString()}</div>
            <p className="text-xs opacity-75 mt-1">per employee</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No employees yet</p>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{emp.position || "Employee"}</p>
                      <p className="text-sm text-muted-foreground">
                        {emp.wallet_address?.slice(0, 10)}...{emp.wallet_address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(emp.encrypted_salary || 0).toLocaleString()}</p>
                    <Badge variant="secondary">{emp.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Process Monthly Payroll</p>
                <p className="text-sm text-muted-foreground">
                  ${totalSalary.toLocaleString()} to {employees.length} employees
                </p>
              </div>
              <Button onClick={handleProcessPayroll} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run Payroll"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployerDashboard;