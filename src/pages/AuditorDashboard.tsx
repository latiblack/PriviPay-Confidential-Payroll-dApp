import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Users, DollarSign, TrendingUp, Shield, Loader2 } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

const AuditorDashboard = () => {
  const { profile } = useAuth();
  const isAuditor = profile?.currentRole === "auditor";
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.encrypted_salary) || 0), 0);
  const totalBonus = employees.reduce((sum, e) => sum + (Number(e.bonus) || 0), 0);
  const avgSalary = employees.length > 0 ? Math.round(totalPayroll / employees.length) : 0;

  if (!isAuditor) {
    return <div className="p-6">Access denied. Only auditors can view this page.</div>;
  }

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
        <h1 className="text-3xl font-bold">Auditor Dashboard</h1>
        <p className="text-muted-foreground text-lg mt-1">Review organization payroll and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-3xl font-bold">${totalPayroll.toLocaleString()}</div>
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

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Total Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalBonus.toLocaleString()}</div>
            <p className="text-xs opacity-75 mt-1">all time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No employees found</p>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{emp.position || "Employee"}</p>
                    <p className="text-sm text-muted-foreground">
                      {emp.wallet_address?.slice(0, 10)}...{emp.wallet_address?.slice(-4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">${Number(emp.encrypted_salary || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">salary</p>
                    </div>
                    <Badge variant="outline">{emp.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditorDashboard;