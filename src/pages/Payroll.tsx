import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  DollarSign, Users, Plus, Send, FileText, CheckCircle, Clock, Trash2
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number;
  walletAddress: string;
  status: "active" | "pending";
}

const PayrollPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([
    { id: "1", name: "Alice Johnson", position: "Developer", salary: 8500, walletAddress: "0x1234...abcd", status: "active" },
    { id: "2", name: "Bob Smith", position: "Manager", salary: 12000, walletAddress: "0x5678...efgh", status: "active" },
    { id: "3", name: "Carol Williams", position: "Designer", salary: 7500, walletAddress: "0x9abc...ijkl", status: "pending" },
  ]);
  
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    salary: "",
    walletAddress: "",
  });
  
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.salary || !newEmployee.walletAddress) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    const emp: Employee = {
      id: Date.now().toString(),
      name: newEmployee.name,
      position: newEmployee.position || "Employee",
      salary: Number(newEmployee.salary),
      walletAddress: newEmployee.walletAddress,
      status: "pending",
    };
    
    setEmployees([...employees, emp]);
    setNewEmployee({ name: "", position: "", salary: "", walletAddress: "" });
    setShowAddForm(false);
    toast({ title: "Employee Added", description: `${emp.name} has been added to the payroll` });
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
    toast({ title: "Employee Removed" });
  };

  const totalPayroll = employees.filter(e => e.status === "active").reduce((sum, e) => sum + e.salary, 0);
  const pendingCount = employees.filter(e => e.status === "pending").length;

  if (!profile?.currentOrganization) {
    return <div className="p-6">No organization found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Process Payroll</h1>
          <p className="text-muted-foreground">Manage employee salaries and payments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payroll</p>
              <p className="text-2xl font-bold">${totalPayroll.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Employees</p>
              <p className="text-2xl font-bold">{employees.filter(e => e.status === "active").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Add New Employee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input 
                  placeholder="John Doe" 
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Position</Label>
                <Input 
                  placeholder="Developer" 
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                />
              </div>
              <div>
                <Label>Monthly Salary ($) *</Label>
                <Input 
                  type="number"
                  placeholder="5000" 
                  value={newEmployee.salary}
                  onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                />
              </div>
              <div>
                <Label>Wallet Address *</Label>
                <Input 
                  placeholder="0x..." 
                  value={newEmployee.walletAddress}
                  onChange={(e) => setNewEmployee({...newEmployee, walletAddress: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddEmployee}>Add Employee</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Employee List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">{emp.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">{emp.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">${emp.salary.toLocaleString()}/mo</p>
                    <p className="text-xs text-muted-foreground font-mono">{emp.walletAddress}</p>
                  </div>
                  <Badge variant={emp.status === "active" ? "default" : "secondary"}>
                    {emp.status}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployee(emp.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process Payroll Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Save Draft</Button>
        <Button className="gap-2">
          <Send className="h-4 w-4" />
          Process Payroll
        </Button>
      </div>
    </div>
  );
};

export default PayrollPage;