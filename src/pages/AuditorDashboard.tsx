import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, CheckCircle, DollarSign, Lock, Users } from "lucide-react";
import { mockEmployees, totalDecryptedPayroll, totalDecryptedBonuses } from "@/lib/mock-data";

const AuditorDashboard = () => {
  const verifications = [
    { check: "Total payroll matches sum of encrypted salaries", status: "verified" },
    { check: "No duplicate payment addresses", status: "verified" },
    { check: "Bonus pool does not exceed approved budget", status: "verified" },
    { check: "All payments executed to registered addresses", status: "verified" },
    { check: "No unauthorized salary modifications", status: "verified" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditor Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Verify encrypted totals — individual data hidden</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" /> Auditor Access
        </Badge>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Employees</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              {mockEmployees.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Payroll (Decrypted for Auditor)</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              ${totalDecryptedPayroll.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Bonuses (Decrypted for Auditor)</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-accent" />
              ${totalDecryptedBonuses.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* What auditor CANNOT see */}
      <Card className="mb-8 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" /> Individual Data — Access Denied
          </CardTitle>
          <CardDescription>
            Auditors can verify totals and compliance without seeing individual salary data
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
                  <TableCell className="text-muted-foreground">{emp.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">🔒 Encrypted</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">🔒 Encrypted</code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" /> Compliance Verifications
          </CardTitle>
          <CardDescription>Computed on encrypted data — verified without decryption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.check} className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm text-foreground">{v.check}</span>
                <Badge variant="outline" className="ml-auto text-accent border-accent/30">Verified</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditorDashboard;
