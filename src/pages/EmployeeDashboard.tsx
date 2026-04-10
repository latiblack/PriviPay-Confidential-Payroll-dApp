import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, EyeOff, DollarSign, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const earningsData = [
  { month: "Jan", value: 8200 },
  { month: "Feb", value: 8200 },
  { month: "Mar", value: 8500 },
  { month: "Apr", value: 8500 },
  { month: "May", value: 8500 },
  { month: "Jun", value: 9000 },
];

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

  const statCards = [
    {
      label: "My Salary",
      value: decrypted ? `$${myData.salary.toLocaleString()}/mo` : myData.encryptedSalary,
      change: "3.5%", up: true, highlighted: true,
    },
    {
      label: "My Bonus",
      value: decrypted ? `$${myData.bonus.toLocaleString()}` : myData.encryptedBonus,
      change: "20%", up: true, highlighted: false,
    },
  ];

  return (
    <div className="space-y-6">
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
                <span className="flex items-center gap-0.5 text-accent">
                  {stat.change} <TrendingUp className="h-3 w-3" />
                </span>
                <span className={stat.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}>
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toggle + Chart */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setDecrypted(!decrypted)} className="gap-2 rounded-xl" size="sm">
          {decrypted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {decrypted ? "Re-encrypt View" : "Decrypt My Data"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Earnings Report</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={earningsData}>
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Salary"]}
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
              <Button variant="ghost" size="sm" className="text-primary text-xs gap-1">
                All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentHistory.map((p) => (
              <div key={p.tx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.date}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.tx}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {decrypted ? `$${p.amount.toLocaleString()}` : "euint256(...)"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
