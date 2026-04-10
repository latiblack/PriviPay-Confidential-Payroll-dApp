import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockEmployees, Employee, totalDecryptedPayroll, totalDecryptedBonuses } from "@/lib/mock-data";
import { Plus, DollarSign, Users, Send, Eye, EyeOff, UserPlus, Shield, Trash2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface InvitedUser {
  id: string;
  email: string;
  walletAddress: string;
  role: "manager" | "employee" | "auditor";
  status: "pending" | "accepted";
  invitedAt: string;
}

const chartData = [
  { month: "12", value: 18000 },
  { month: "13", value: 32000 },
  { month: "14", value: 28000 },
  { month: "15", value: 45000 },
  { month: "16", value: 42000 },
  { month: "17", value: 55000 },
  { month: "18", value: 78560 },
  { month: "19", value: 65000 },
  { month: "20", value: 90000 },
  { month: "21", value: 110000 },
  { month: "22", value: 130000 },
];

const payrollHistory = [
  { date: "2025-04-01", type: "Salary Payout", amount: "$40,700", status: "completed" },
  { date: "2025-03-01", type: "Salary Payout", amount: "$40,700", status: "completed" },
  { date: "2025-03-15", type: "Bonus Distribution", amount: "$5,600", status: "completed" },
  { date: "2025-02-01", type: "Salary Payout", amount: "$38,200", status: "completed" },
];

const targets = [
  { label: "Payroll Budget", progress: 60, color: "hsl(231, 75%, 60%)", deadline: "1 month later" },
  { label: "Bonus Pool", progress: 70, color: "hsl(170, 60%, 45%)", deadline: "3 month later" },
  { label: "New Hires", progress: 43, color: "hsl(340, 65%, 55%)", deadline: "1 month later" },
  { label: "Compliance", progress: 10, color: "hsl(220, 9%, 46%)", deadline: "4 month later" },
];

const roleColors: Record<string, string> = {
  manager: "bg-primary/10 text-primary border-primary/20",
  employee: "bg-accent/10 text-accent border-accent/20",
  auditor: "bg-muted text-muted-foreground border-border",
};

const EmployerDashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [showDecrypted, setShowDecrypted] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteWallet, setInviteWallet] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "employee" | "auditor">("employee");
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([
    { id: "inv1", email: "manager@company.com", walletAddress: "0xaB12...cD34", role: "manager", status: "accepted", invitedAt: "2025-03-15" },
    { id: "inv2", email: "auditor@firm.com", walletAddress: "0xeF56...gH78", role: "auditor", status: "pending", invitedAt: "2025-04-05" },
  ]);

  const handleAddEmployee = () => {
    if (!newName || !newAddress || !newSalary) return;
    const emp: Employee = {
      id: String(employees.length + 1),
      name: newName, address: newAddress, role: newRole,
      encryptedSalary: `euint256(0x${Math.random().toString(16).slice(2, 6)}...)`,
      decryptedSalary: Number(newSalary),
      encryptedBonus: "euint256(0x0000...)", decryptedBonus: 0,
    };
    setEmployees([...employees, emp]);
    setNewName(""); setNewAddress(""); setNewRole(""); setNewSalary("");
    setDialogOpen(false);
    toast({ title: "Employee added", description: `${newName}'s salary encrypted and stored on-chain.` });
  };

  const handleInviteUser = () => {
    if (!inviteEmail || !inviteWallet) return;
    const newInvite: InvitedUser = {
      id: `inv${Date.now()}`, email: inviteEmail, walletAddress: inviteWallet,
      role: inviteRole, status: "pending", invitedAt: new Date().toISOString().split("T")[0],
    };
    setInvitedUsers([...invitedUsers, newInvite]);
    setInviteEmail(""); setInviteWallet(""); setInviteRole("employee");
    setInviteDialogOpen(false);
    toast({ title: "Invite sent", description: `${inviteEmail} invited as ${inviteRole}.` });
  };

  const handleRevokeAccess = (id: string) => {
    setInvitedUsers(invitedUsers.filter((u) => u.id !== id));
    toast({ title: "Access revoked", description: "User access has been removed." });
  };

  const handlePayAll = () => {
    toast({ title: "Payroll executed", description: "All encrypted salary transfers have been initiated on-chain." });
  };

  const statCards = [
    {
      label: "Total Payroll",
      value: showDecrypted ? `$${totalDecryptedPayroll.toLocaleString()}` : "euint256(0xff42...)",
      change: "12%", changeLabel: "Increase From Target", up: true, highlighted: true,
    },
    {
      label: "Employees",
      value: String(employees.length),
      change: "2%", changeLabel: "Decrease From Target", up: false, highlighted: false,
    },
    {
      label: "Total Bonuses",
      value: showDecrypted ? `$${totalDecryptedBonuses.toLocaleString()}` : "euint256(0xee31...)",
      change: "6%", changeLabel: "Increase From Target", up: true, highlighted: false,
    },
    {
      label: "Balance",
      value: showDecrypted ? "$74,330" : "euint256(0xba09...)",
      change: "1%", changeLabel: "Increase From Target", up: true, highlighted: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={stat.highlighted
              ? "bg-primary text-primary-foreground border-0 shadow-lg"
              : "border shadow-sm"
            }
          >
            <CardContent className="p-5">
              <p className={`text-sm font-medium ${stat.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {stat.label}
              </p>
              <p className={`text-2xl font-bold mt-1 ${stat.highlighted ? "text-primary-foreground" : "text-foreground"}`}>
                {stat.value}
              </p>
              <div className={`flex items-center gap-1 mt-2 text-xs ${stat.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                <span className={`flex items-center gap-0.5 ${stat.up ? "text-accent" : "text-destructive"}`}>
                  {stat.change}
                  {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </span>
                <span>{stat.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - takes 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Analytics Report</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1">
                    Total Earning
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1">
                    Monthly
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(231, 75%, 60%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(231, 75%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} tickFormatter={(v) => `${v / 1000}k`} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid hsl(220, 13%, 91%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(231, 75%, 60%)" strokeWidth={2.5} fill="url(#colorValue)" dot={false} activeDot={{ r: 6, fill: "hsl(231, 75%, 60%)", stroke: "#fff", strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Activity Summary</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 text-primary text-xs">
                  View More <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollHistory.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-sm">{item.date}</TableCell>
                      <TableCell className="text-foreground text-sm font-medium">{item.type}</TableCell>
                      <TableCell className="text-foreground text-sm font-semibold">{item.amount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-accent/10 text-accent border-0 text-xs">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2 rounded-xl justify-start" size="sm">
                    <Plus className="h-4 w-4" /> Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Doe" /></div>
                    <div><Label>Wallet Address</Label><Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="0x..." /></div>
                    <div><Label>Role</Label><Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Engineer" /></div>
                    <div><Label>Salary (encrypted as euint)</Label><Input type="number" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} placeholder="5000" /></div>
                    <Button onClick={handleAddEmployee} className="w-full">Encrypt & Add</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 rounded-xl justify-start" size="sm">
                    <UserPlus className="h-4 w-4" /> Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Invite User to Organization</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Email</Label><Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@company.com" /></div>
                    <div><Label>Wallet Address</Label><Input value={inviteWallet} onChange={(e) => setInviteWallet(e.target.value)} placeholder="0x..." /></div>
                    <div>
                      <Label>Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "manager" | "employee" | "auditor")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="auditor">Auditor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleInviteUser} className="w-full gap-2"><Send className="h-4 w-4" /> Send Invite</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={() => setShowDecrypted(!showDecrypted)} className="w-full gap-2 rounded-xl justify-start" size="sm">
                {showDecrypted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDecrypted ? "Hide Values" : "Decrypt Values"}
              </Button>
              <Button variant="secondary" onClick={handlePayAll} className="w-full gap-2 rounded-xl justify-start" size="sm">
                <Send className="h-4 w-4" /> Pay All Salaries
              </Button>
            </CardContent>
          </Card>

          {/* Targets */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Target</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {targets.map((t) => (
                <div key={t.label} className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative h-10 w-10 shrink-0">
                    <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(220, 13%, 91%)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={t.color}
                        strokeWidth="3"
                        strokeDasharray={`${t.progress}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground">
                      {t.progress}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.deadline}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Access Management */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Access
              </CardTitle>
              <CardDescription className="text-xs">Users with organization access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invitedUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground font-mono">{user.walletAddress}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${roleColors[user.role]}`}>
                    {user.role}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={() => handleRevokeAccess(user.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
