import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { mockEmployees, Employee, totalDecryptedPayroll, totalDecryptedBonuses } from "@/lib/mock-data";
import { Plus, DollarSign, Users, Send, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const EmployerDashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [showDecrypted, setShowDecrypted] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddEmployee = () => {
    if (!newName || !newAddress || !newSalary) return;
    const emp: Employee = {
      id: String(employees.length + 1),
      name: newName,
      address: newAddress,
      role: newRole,
      encryptedSalary: `euint256(0x${Math.random().toString(16).slice(2, 6)}...)`,
      decryptedSalary: Number(newSalary),
      encryptedBonus: "euint256(0x0000...)",
      decryptedBonus: 0,
    };
    setEmployees([...employees, emp]);
    setNewName("");
    setNewAddress("");
    setNewRole("");
    setNewSalary("");
    setDialogOpen(false);
    toast({ title: "Employee added", description: `${newName}'s salary encrypted and stored on-chain.` });
  };

  const handlePayAll = () => {
    toast({ title: "Payroll executed", description: "All encrypted salary transfers have been initiated on-chain." });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employer Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage encrypted payroll & compensation</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Lock className="h-3 w-3" /> Employer Access
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Employees</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              {employees.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Payroll (Encrypted)</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              {showDecrypted ? `$${totalDecryptedPayroll.toLocaleString()}` : "euint256(0xff42...)"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Bonuses (Encrypted)</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-accent" />
              {showDecrypted ? `$${totalDecryptedBonuses.toLocaleString()}` : "euint256(0xee31...)"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Employee</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <Label>Wallet Address</Label>
                <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="0x..." />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Engineer" />
              </div>
              <div>
                <Label>Salary (will be encrypted as euint)</Label>
                <Input type="number" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} placeholder="5000" />
              </div>
              <Button onClick={handleAddEmployee} className="w-full">Encrypt & Add</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={() => setShowDecrypted(!showDecrypted)} className="gap-2">
          {showDecrypted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDecrypted ? "Hide Values" : "Decrypt Values"}
        </Button>
        <Button variant="secondary" onClick={handlePayAll} className="gap-2">
          <Send className="h-4 w-4" /> Pay All Salaries
        </Button>
      </div>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Last Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{emp.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{emp.address}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{emp.role}</TableCell>
                  <TableCell>
                    {showDecrypted ? (
                      <span className="font-semibold text-foreground">${emp.decryptedSalary?.toLocaleString()}</span>
                    ) : (
                      <code className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">{emp.encryptedSalary}</code>
                    )}
                  </TableCell>
                  <TableCell>
                    {showDecrypted ? (
                      <span className="font-semibold text-accent">${emp.decryptedBonus?.toLocaleString()}</span>
                    ) : (
                      <code className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">{emp.encryptedBonus}</code>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{emp.lastPaid || "Never"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployerDashboard;
