import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, DollarSign, Lock, Users, TrendingUp, ArrowRight } from "lucide-react";
import { mockEmployees, totalDecryptedPayroll, totalDecryptedBonuses } from "@/lib/mock-data";

const AuditorDashboard = () => {
  const verifications = [
    { check: "Total payroll matches sum of encrypted salaries", status: "verified" },
    { check: "No duplicate payment addresses", status: "verified" },
    { check: "Bonus pool does not exceed approved budget", status: "verified" },
    { check: "All payments executed to registered addresses", status: "verified" },
    { check: "No unauthorized salary modifications", status: "verified" },
  ];

  const statCards = [
    { label: "Total Employees", value: String(mockEmployees.length), icon: Users, change: "0%", highlighted: false },
    { label: "Total Payroll", value: `$${totalDecryptedPayroll.toLocaleString()}`, icon: DollarSign, change: "6%", highlighted: true },
    { label: "Total Bonuses", value: `$${totalDecryptedBonuses.toLocaleString()}`, icon: DollarSign, change: "1%", highlighted: false },
  ];

  return (
    <div className="space-y-6">
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
        {/* Individual Data - Access Denied */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg font-bold">Individual Data — Access Denied</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-primary text-xs gap-1">
                View More <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              Auditors can verify totals without seeing individual salary data
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
                {mockEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="text-muted-foreground text-sm">{emp.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0 text-xs">🔒 Encrypted</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0 text-xs">🔒 Encrypted</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Compliance Verifications */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" /> Compliance
            </CardTitle>
            <CardDescription className="text-xs">Verified on encrypted data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {verifications.map((v) => (
              <div key={v.check} className="flex items-start gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{v.check}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditorDashboard;
