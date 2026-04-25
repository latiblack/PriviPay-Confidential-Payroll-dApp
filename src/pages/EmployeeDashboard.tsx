import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, DollarSign, Calendar, TrendingUp, ArrowRight, User, Loader2, Lock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type PayrollRecord = Database["public"]["Tables"]["payroll_records"]["Row"];

const EmployeeDashboard = () => {
  const { profile } = useAuth();
  const isOwnerView = profile?.currentRole === "owner";
  const isConfidentialView = profile?.currentRole === "employee";

  const [decrypted, setDecrypted] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PayrollRecord[]>([]);

  const fetchEmployees = async () => {
    if (!profile?.currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id);

      if (error) throw error;
      setEmployees(data || []);
      if (data && data.length > 0) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyData = async () => {
    if (!profile?.currentOrganization?.id || !profile.walletAddress) return;

    try {
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id)
        .eq("wallet_address", profile.walletAddress)
        .single();

      if (empError && empError.code !== "PGRST116") throw empError;
      setMyEmployee(empData || null);

      if (empData) {
        const { data: history, error: histError } = await supabase
          .from("payroll_records")
          .select("*")
          .eq("employee_id", empData.id)
          .order("created_at", { ascending: false });

        if (!histError) {
          setPaymentHistory(history || []);
        }
      }
    } catch (err) {
      console.error("Error fetching my data:", err);
    }
  };

  useEffect(() => {
    if (isOwnerView) {
      fetchEmployees();
    } else {
      fetchMyData();
    }
  }, [profile?.currentOrganization?.id, isOwnerView, profile?.walletAddress]);

  const currentEmployee = selectedEmployeeId
    ? employees.find(e => e.id === selectedEmployeeId)
    : null;

  const myData = {
    name: myEmployee?.wallet_address ? `${myEmployee.wallet_address.slice(0, 6)}...${myEmployee.wallet_address.slice(-4)}` : "Unknown",
    address: myEmployee?.wallet_address || "",
    role: myEmployee?.position || "Employee",
    encryptedSalary: myEmployee?.encrypted_salary || "***",
    salary: Number(myEmployee?.encrypted_salary) || 0,
    encryptedBonus: myEmployee?.encrypted_bonus || "***",
    bonus: Number(myEmployee?.encrypted_bonus) || 0,
  };

  const statCards = [
    {
      label: isOwnerView ? "Employee Salary (Encrypted)" : "My Salary (Encrypted)",
      value: decrypted && !isConfidentialView ? `$${myData.salary.toLocaleString()}/mo` : myData.encryptedSalary,
      change: isConfidentialView ? "Confidential" : "3.5%", up: !isConfidentialView, highlighted: true,
    },
    {
      label: isOwnerView ? "Employee Bonus (Encrypted)" : "My Bonus (Encrypted)",
      value: decrypted && !isConfidentialView ? `$${myData.bonus.toLocaleString()}` : myData.encryptedBonus,
      change: isConfidentialView ? "Confidential" : "20%", up: !isConfidentialView, highlighted: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Owner: Employee Selector */}
      {isOwnerView && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Select Employee:</span>
                </div>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.wallet_address.slice(0, 8)}...{emp.wallet_address.slice(-4)} - {emp.position || "Employee"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confidential View Notice */}
      {isConfidentialView && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Your Data is Confidential</p>
              <p className="text-sm text-amber-600">Your salary and bonus are encrypted. Only you can view them when decrypted.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {isConfidentialView ? (
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Lock className="h-3 w-3" /> {stat.change}
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-0.5 text-accent">
                      {stat.change} <TrendingUp className="h-3 w-3" />
                    </span>
                    <span className={stat.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}>
                      vs last month
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toggle - Only for owners/managers, not employees */}
      {!isConfidentialView && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDecrypted(!decrypted)} className="gap-2 rounded-xl" size="sm">
            {decrypted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {decrypted ? "Re-encrypt View" : "Decrypt Data"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">
              {isOwnerView ? `Earnings Report - Encrypted` : "My Earnings Report"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isConfidentialView ? "Your earnings are encrypted using FHE" : "View encrypted salary data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={[
                { month: "Jan", value: isConfidentialView ? 0 : 8200 },
                { month: "Feb", value: isConfidentialView ? 0 : 8200 },
                { month: "Mar", value: isConfidentialView ? 0 : 8500 },
                { month: "Apr", value: isConfidentialView ? 0 : 8500 },
                { month: "May", value: isConfidentialView ? 0 : 8500 },
                { month: "Jun", value: isConfidentialView ? 0 : 9000 },
              ]}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(231, 75%, 60%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(231, 75%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} tickFormatter={(v) => `$${v / 1000}k`} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(220, 13%, 91%)" }}
                  formatter={(value: number) => [isConfidentialView ? "***" : `$${value.toLocaleString()}`, "Salary"]}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(231, 75%, 60%)" strokeWidth={2.5} fill="url(#colorEarnings)" dot={false} activeDot={{ r: 6, fill: "hsl(231, 75%, 60%)", stroke: "#fff", strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> History
              </CardTitle>
              {isConfidentialView && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentHistory.length > 0 ? (
              paymentHistory.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{p.tx_hash || p.id}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {isConfidentialView ? "***" : decrypted ? `$${Number(p.encrypted_amount).toLocaleString()}` : "***"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No payment history</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;