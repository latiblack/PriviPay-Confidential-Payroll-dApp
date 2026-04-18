import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { 
  DollarSign, Users, Plus, Send, FileText, CheckCircle, Clock, Trash2, Loader2
} from "lucide-react";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

const PayrollPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    salary: "",
    walletAddress: "",
  });
  
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchEmployees = async () => {
    if (!profile?.currentOrganization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id);
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [profile?.currentOrganization]);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.salary || !newEmployee.walletAddress) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    if (!profile?.currentOrganization?.id) {
      toast({ title: "Error", description: "No organization selected", variant: "destructive" });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          organization_id: profile.currentOrganization.id,
          wallet_address: newEmployee.walletAddress,
          position: newEmployee.position || "Employee",
          status: "pending",
          encrypted_salary: newEmployee.salary, // Would be FHE encrypted in production
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setEmployees([...employees, data]);
      }
      
      setNewEmployee({ name: "", position: "", salary: "", walletAddress: "" });
      setShowAddForm(false);
      toast({ title: "Employee Added", description: `${newEmployee.name} has been added to the payroll` });
    } catch (err) {
      console.error("Error adding employee:", err);
      toast({ title: "Error", description: "Failed to add employee", variant: "destructive" });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setEmployees(employees.filter(e => e.id !== id));
      toast({ title: "Employee Removed" });
    } catch (err) {
      console.error("Error deleting employee:", err);
      toast({ title: "Error", description: "Failed to delete employee", variant: "destructive" });
    }
  };
  const pendingCount = employees.filter(e => e.status === "pending").length;
  
  const getEmployeeName = (emp: EmployeeRow) => {
    if (emp.wallet_address) {
      return `${emp.wallet_address.slice(0, 6)}...${emp.wallet_address.slice(-4)}`;
    }
    return "Unknown";
  };

  const getEmployeeSalary = (emp: EmployeeRow): number => {
    if (emp.encrypted_salary) {
      return Number(emp.encrypted_salary);
    }
    return 0;
  };
  
  const totalPayroll = employees.filter(e => e.status === "active").reduce((sum, e) => sum + getEmployeeSalary(e), 0);

  if (!profile?.currentOrganization) {
    return <div className="p-6">No organization found</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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
                    <span className="text-sm font-semibold">{getEmployeeName(emp).charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{getEmployeeName(emp)}</p>
                    <p className="text-sm text-muted-foreground">{emp.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">${getEmployeeSalary(emp).toLocaleString()}/mo</p>
                    <p className="text-xs text-muted-foreground font-mono">{emp.wallet_address}</p>
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