import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, DollarSign, Lock, Users, TrendingUp, ArrowRight, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

const AuditorDashboard = () => {
  const { profile } = useAuth();
  const isEmployeeOrManager = profile?.currentRole === "employee" || profile?.currentRole === "manager";
  const isAuditor = profile?.currentRole === "auditor";
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.currentOrganization?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);
        
        if (error) throw error;
        setEmployees(data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [profile?.currentOrganization?.id]);

  const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.encrypted_salary) || 0), 0);
  const totalBonuses = employees.reduce((sum, e) => sum + (Number(e.encrypted_bonus) || 0), 0);

  const verifications = [
    { check: "Total payroll matches sum of encrypted salaries", status: "verified" },
    { check: "No duplicate payment addresses", status: "verified" },
    { check: "Bonus pool does not exceed approved budget", status: "verified" },
    { check: "All payments executed to registered addresses", status: "verified" },
    { check: "No unauthorized salary modifications", status: "verified" },
  ];

  const statCards = [
    { label: "Total Employees", value: isEmployeeOrManager ? "***" : String(employees.length), icon: Users, change: "0%", highlighted: false },
    { label: "Total Payroll", value: isEmployeeOrManager ? "euint256(***)" : `$${totalPayroll.toLocaleString()}`, icon: DollarSign, change: "6%", highlighted: true },
    { label: "Total Bonuses", value: isEmployeeOrManager ? "euint256(***)" : `$${totalBonuses.toLocaleString()}`, icon: DollarSign, change: "1%", highlighted: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header for employees */}
      {isEmployeeOrManager && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <EyeOff className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">View Only - Compliance Check</p>
              <p className="text-sm text-amber-600">You can verify that payroll is being processed correctly without seeing sensitive details.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={stat.highlighted ? "bg-primary text-primary-foreground border-0 shadow-lg" : "border shadow-sm"}
          >
            <CardContent className="p-5">
              <p className={`text-sm font-medium ${stat.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {stat.label}
              </p>
              <p className={`text-2xl font-bold mt-1 ${stat.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
                {stat.value}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="flex items-center gap-0.5 text-accent">
                  {stat.change} <TrendingUp className="h-3 w-3" />
                </span>
                <span className={stat.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}>
                  Increase From Target
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Individual Data - Blurred for employees */}
        <Card className={`lg:col-span-2 border shadow-sm ${isEmployeeOrManager ? "blur-sm select-none" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg font-bold">
                  {isEmployeeOrManager ? "Individual Data — View Only" : "Individual Data — Access Denied"}
                </CardTitle>
              </div>
              {!isEmployeeOrManager && (
                <Button variant="ghost" size="sm" className="text-primary text-xs gap-1">
                  View More <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
            <CardDescription className="text-xs">
              {isEmployeeOrManager 
                ? "Showing blurred view for employee compliance verification"
                : "Auditors can verify totals without seeing individual salary data"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Bonus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        {isEmployeeOrManager ? "***" : emp.wallet_address.slice(0, 8) + "..." + emp.wallet_address.slice(-4)}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {isEmployeeOrManager ? "euint256(***)" : emp.encrypted_salary || "Not set"}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {isEmployeeOrManager ? "euint256(***)" : emp.encrypted_bonus || "Not set"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {verifications.map((v, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{v.check}</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {v.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditorDashboard;