import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Eye, EyeOff, DollarSign, Calendar } from "lucide-react";

const EmployeeDashboard = () => {
  const [decrypted, setDecrypted] = useState(false);

  const myData = {
    name: "Alice Johnson",
    address: "0x1a2B...3c4D",
    role: "Senior Developer",
    encryptedSalary: "euint256(0x7f3a...)",
    salary: 8500,
    encryptedBonus: "euint256(0x2b1c...)",
    bonus: 1200,
  };

  const paymentHistory = [
    { date: "2025-04-01", amount: 8500, tx: "0xabc1...def2" },
    { date: "2025-03-01", amount: 8500, tx: "0x1234...5678" },
    { date: "2025-02-01", amount: 8500, tx: "0x9abc...def0" },
    { date: "2025-01-01", amount: 8200, tx: "0xfed1...2345" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">View your encrypted compensation</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Lock className="h-3 w-3" /> Employee Access
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Salary (Encrypted)</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              {decrypted ? `$${myData.salary.toLocaleString()}/mo` : myData.encryptedSalary}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Bonus (Encrypted)</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              {decrypted ? `$${myData.bonus.toLocaleString()}` : myData.encryptedBonus}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Button
        variant="outline"
        onClick={() => setDecrypted(!decrypted)}
        className="gap-2 mb-8"
      >
        {decrypted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {decrypted ? "Re-encrypt View" : "Decrypt My Data"}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Payment History
          </CardTitle>
          <CardDescription>Only you can see your payment amounts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((p) => (
                <TableRow key={p.tx}>
                  <TableCell className="text-foreground">{p.date}</TableCell>
                  <TableCell>
                    {decrypted ? (
                      <span className="font-semibold text-foreground">${p.amount.toLocaleString()}</span>
                    ) : (
                      <code className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">euint256(...)</code>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground">{p.tx}</code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
