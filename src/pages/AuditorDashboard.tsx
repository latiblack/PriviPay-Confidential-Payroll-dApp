import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/currency";
import { 
  Users, DollarSign, TrendingUp, Shield, CheckCircle, AlertCircle, 
  Clock, Calendar, Wallet, FileText, Activity, Target, AlertTriangle,
  Scale, Timer, MoneyDown, BarChart3, Loader2
} from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type PayrollRecord = Database["public"]["Tables"]["payroll_records"]["Row"];
type Bonus = Database["public"]["Tables"]["bonuses"]["Row"];

interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  score: number;
  maxScore: number;
  status: "pass" | "warning" | "fail";
  details: string;
}

const AuditorDashboard = () => {
  const { profile } = useAuth();
  const isAuditor = profile?.currentRole === "auditor" || profile?.currentRole === "owner";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.currentOrganization?.id) return;

      try {
        // Fetch employees
        const { data: empData } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);
        
        // Fetch payroll records
        const { data: payData } = await supabase
          .from("payroll_records")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .order("paid_at", { ascending: false });

        // Fetch bonuses
        const { data: bonusData } = await supabase
          .from("bonuses")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);

        setEmployees(empData || []);
        setPayrollRecords(payData || []);
        setBonuses(bonusData || []);

        // Calculate compliance checks
        calculateComplianceChecks(empData || [], payData || [], bonusData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.currentOrganization?.id]);

  const calculateComplianceChecks = (
    emps: Employee[], 
    payroll: PayrollRecord[], 
    bonusData: Bonus[]
  ) => {
    const checks: ComplianceCheck[] = [];

    // 1. Payment Accuracy - Workers paid amount promised
    const completedPayments = payroll.filter(p => p.status === "completed");
    const totalPaid = completedPayments.reduce((sum, p) => sum + Number(p.encrypted_amount || 0), 0);
    const totalPromised = emps.reduce((sum, e) => sum + (Number(e.encrypted_salary) || 0), 0);
    const paymentAccuracy = totalPromised > 0 ? Math.min(100, (totalPaid / totalPromised) * 100) : 100;
    checks.push({
      id: "payment_accuracy",
      name: "Payment Accuracy",
      description: "Workers paid the amount promised in their contract",
      score: Math.round(paymentAccuracy),
      maxScore: 100,
      status: paymentAccuracy >= 95 ? "pass" : paymentAccuracy >= 80 ? "warning" : "fail",
      details: `${formatCurrency(totalPaid)} paid vs ${formatCurrency(totalPromised)} promised`
    });

    // 2. Payment Completeness - All active employees paid
    const activeEmployees = emps.filter(e => e.status === "active");
    const paidEmployeeIds = new Set(completedPayments.map(p => p.employee_id));
    const employeesPaid = activeEmployees.filter(e => paidEmployeeIds.has(e.id)).length;
    const paymentCompleteness = activeEmployees.length > 0 
      ? (employeesPaid / activeEmployees.length) * 100 
      : 100;
    checks.push({
      id: "payment_completeness",
      name: "Payment Completeness",
      description: "All active employees received payment this period",
      score: Math.round(paymentCompleteness),
      maxScore: 100,
      status: paymentCompleteness === 100 ? "pass" : paymentCompleteness >= 80 ? "warning" : "fail",
      details: `${employeesPaid}/${activeEmployees.length} employees paid`
    });

    // 3. Payment Timing - Payments made within expected timeframe
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPayments = completedPayments.filter(p => {
      const payDate = new Date(p.paid_at || p.created_at);
      return payDate >= thirtyDaysAgo;
    });
    const timingScore = completedPayments.length > 0 
      ? (recentPayments.length / completedPayments.length) * 100 
      : 100;
    checks.push({
      id: "payment_timing",
      name: "Payment Timing",
      description: "Payments processed within expected timeframe (last 30 days)",
      score: Math.round(timingScore),
      maxScore: 100,
      status: timingScore >= 90 ? "pass" : timingScore >= 70 ? "warning" : "fail",
      details: `${recentPayments.length} of ${completedPayments.length} payments in last 30 days`
    });

    // 4. Bonus Distribution Compliance
    const totalBonus = bonusData.reduce((sum, b) => sum + Number(b.amount), 0);
    const bonusPercentage = totalPayroll > 0 ? (totalBonus / totalPayroll) * 100 : 0;
    // Bonus should typically be 5-20% of payroll
    const bonusCompliance = bonusPercentage <= 20 ? 100 : Math.max(0, 100 - (bonusPercentage - 20) * 5);
    checks.push({
      id: "bonus_compliance",
      name: "Bonus Distribution",
      description: "Bonus payments within acceptable range (≤20% of payroll)",
      score: Math.round(bonusCompliance),
      maxScore: 100,
      status: bonusCompliance >= 90 ? "pass" : bonusCompliance >= 70 ? "warning" : "fail",
      details: `Total bonuses: ${formatCurrency(totalBonus)} (${bonusPercentage.toFixed(1)}% of payroll)`
    });

    // 5. Workforce Documentation
    const documentedPositions = emps.filter(e => e.position && e.position !== "").length;
    const docScore = emps.length > 0 ? (documentedPositions / emps.length) * 100 : 100;
    checks.push({
      id: "workforce_documentation",
      name: "Workforce Documentation",
      description: "All employees have documented positions/roles",
      score: Math.round(docScore),
      maxScore: 100,
      status: docScore === 100 ? "pass" : docScore >= 80 ? "warning" : "fail",
      details: `${documentedPositions}/${emps.length} employees with documented positions`
    });

    // 6. Payroll Record Integrity
    const recordsWithTx = payroll.filter(p => p.tx_hash && p.tx_hash !== "").length;
    const integrityScore = payroll.length > 0 ? (recordsWithTx / payroll.length) * 100 : 100;
    checks.push({
      id: "record_integrity",
      name: "Transaction Records",
      description: "All payments have associated blockchain transaction records",
      score: Math.round(integrityScore),
      maxScore: 100,
      status: integrityScore === 100 ? "pass" : integrityScore >= 80 ? "warning" : "fail",
      details: `${recordsWithTx}/${payroll.length} payments with transaction records`
    });

    // 7. Salary Data Accuracy
    const validSalaries = emps.filter(e => Number(e.encrypted_salary) > 0).length;
    const salaryAccuracyScore = emps.length > 0 ? (validSalaries / emps.length) * 100 : 100;
    checks.push({
      id: "salary_accuracy",
      name: "Salary Data Accuracy",
      description: "All employees have valid salary data recorded",
      score: Math.round(salaryAccuracyScore),
      maxScore: 100,
      status: salaryAccuracyScore === 100 ? "pass" : salaryAccuracyScore >= 80 ? "warning" : "fail",
      details: `${validSalaries}/${emps.length} employees with valid salary data`
    });

    // 8. Regulatory Compliance Score (aggregate)
    const avgScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
    checks.push({
      id: "overall_regulatory",
      name: "Overall Compliance",
      description: "Overall regulatory compliance score based on all checks",
      score: Math.round(avgScore),
      maxScore: 100,
      status: avgScore >= 90 ? "pass" : avgScore >= 70 ? "warning" : "fail",
      details: `Based on ${checks.length} compliance checks`
    });

    setComplianceChecks(checks);
  };

  const getOverallScore = () => {
    const overall = complianceChecks.find(c => c.id === "overall_regulatory");
    return overall?.score || 0;
  };

  const getStatusColor = (status: "pass" | "warning" | "fail") => {
    switch (status) {
      case "pass": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "fail": return "text-red-600";
    }
  };

  const getStatusBg = (status: "pass" | "warning" | "fail") => {
    switch (status) {
      case "pass": return "bg-green-100";
      case "warning": return "bg-yellow-100";
      case "fail": return "bg-red-100";
    }
  };

  if (!isAuditor) {
    return <div className="p-6">Access denied. Only auditors and owners can view this page.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.encrypted_salary) || 0), 0);
  const totalPaid = payrollRecords.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.encrypted_amount || 0), 0);
  const totalBonus = bonuses.reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Compliance Auditor
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Financial compliance and regulatory reporting
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Read-Only View
        </Badge>
      </div>

      {/* Overall Compliance Score */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Overall Compliance Score</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-bold">{getOverallScore()}%</span>
                <span className="text-sm opacity-80">/ 100</span>
              </div>
              <p className="text-sm opacity-60 mt-2">
                Based on {complianceChecks.length - 1} compliance checks
              </p>
            </div>
            <div className="w-32 h-32 rounded-full border-8 border-white/20 flex items-center justify-center">
              <Target className="w-16 h-16 opacity-80" />
            </div>
          </div>
          <Progress value={getOverallScore()} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">active workforce</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monthly Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">promised amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MoneyDown className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Payments Made
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollRecords.filter(p => p.status === "completed").length}</div>
            <p className="text-xs text-muted-foreground">transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBonus)}</div>
            <p className="text-xs text-muted-foreground">distributed</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {complianceChecks.filter(c => c.id !== "overall_regulatory").map((check) => (
          <Card key={check.id} className={getStatusBg(check.status)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{check.name}</span>
                {check.status === "pass" && <CheckCircle className="h-5 w-5 text-green-600" />}
                {check.status === "warning" && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                {check.status === "fail" && <AlertTriangle className="h-5 w-5 text-red-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{check.score}%</span>
                <span className={`text-xs font-medium ${getStatusColor(check.status)}`}>
                  {check.status.toUpperCase()}
                </span>
              </div>
              <Progress value={check.score} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">{check.description}</p>
              <p className="text-xs font-medium mt-1">{check.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payroll Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Complete audit trail of all payments</CardDescription>
        </CardHeader>
        <CardContent>
          {payrollRecords.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No payment records found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Transaction</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRecords.slice(0, 20).map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">
                        {record.paid_at 
                          ? new Date(record.paid_at).toLocaleDateString() 
                          : "Pending"}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">
                        {record.tx_hash ? (
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${record.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {record.tx_hash.slice(0, 10)}...
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No tx</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {formatCurrency(Number(record.encrypted_amount || 0))}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={record.status === "completed" ? "default" : "secondary"}>
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payrollRecords.length > 20 && (
                <p className="text-center py-4 text-sm text-muted-foreground">
                  Showing 20 of {payrollRecords.length} records. Export for complete list.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Salary Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Salary Structure Audit
          </CardTitle>
          <CardDescription>Review of employee compensation records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{emp.name || "Unnamed Employee"}</p>
                  <p className="text-sm text-muted-foreground">
                    {emp.position || "Staff"} • {emp.wallet_address?.slice(0, 8)}...{emp.wallet_address?.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(Number(emp.encrypted_salary || 0))}</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditorDashboard;