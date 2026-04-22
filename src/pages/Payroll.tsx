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
  DollarSign, Users, Plus, Send, FileText, CheckCircle, Clock, Trash2, Loader2, UserPlus
} from "lucide-react";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

const PayrollPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    salary: "",
    walletAddress: "",
    employeeId: "",
  });
  
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchEmployees = async () => {
    if (!profile?.currentOrganization?.id) return;
    
    try {
      // Get employees from employees table
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id)
        .order("created_at", { ascending: false });
      
      if (empError) throw empError;
      setEmployees(empData || []);
      
      // Get all org members from user_roles (employees who joined via invite)
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("organization_id", profile.currentOrganization.id)
        .neq("role", "pending");
      
      if (rolesError) throw rolesError;
      
      // Combine employees table + user_roles members who aren't in employees yet
      setOrgMembers(rolesData || []);
      
      console.log("Employees:", empData?.length);
      console.log("Org members (from user_roles):", rolesData?.length);
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

const handleSelectEmployeeFromList = (emp: EmployeeRow) => {
    console.log("Selecting employee from list:", emp.id);
    setSelectedEmployeeId(emp.id);
    setNewEmployee({
      name: "",
      position: emp.position || "",
      salary: emp.encrypted_salary || "",
      walletAddress: emp.wallet_address,
      employeeId: emp.id,
    });
    console.log("SelectedEmployeeId set to:", emp.id);
  };

  const handleSelectExistingEmployee = (employeeId: string) => {
    console.log("Selecting employee from dropdown:", employeeId);
    
    // First check if it's in employees table
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setSelectedEmployeeId(emp.id);
      setNewEmployee({
        name: "",
        position: emp.position || "",
        salary: emp.encrypted_salary || "",
        walletAddress: emp.wallet_address,
        employeeId: emp.id,
      });
      console.log("Employee loaded from employees table:", emp.wallet_address, emp.position);
      return;
    }
    
    // If not found in employees, check user_roles
    const member = orgMembers.find(m => m.user_id === employeeId);
    if (member) {
      // For members not in employees table, we can only set position and salary as new
      setSelectedEmployeeId(member.user_id);
      setNewEmployee({
        name: "",
        position: member.role || "",
        salary: "",
        walletAddress: member.user_id,
        employeeId: "", // Empty means will create new record
      });
      console.log("Member loaded from user_roles:", member.user_id, member.role);
    }
  };

  const handleClearForm = () => {
    console.log("Clearing form, resetting selectedEmployeeId");
    setSelectedEmployeeId("");
    setNewEmployee({
      name: "",
      position: "",
      salary: "",
      walletAddress: "",
      employeeId: "",
    });
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.walletAddress || !newEmployee.salary) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    if (!profile?.currentOrganization?.id) {
      toast({ title: "Error", description: "No organization selected", variant: "destructive" });
      return;
    }
    
    try {
      // Check if employeeId looks like a UUID (from employees table) vs wallet address (from user_roles)
      if (newEmployee.employeeId && newEmployee.employeeId.includes("-")) {
        // Update existing employee in employees table
        const { data, error } = await supabase
          .from("employees")
          .update({
            position: newEmployee.position || "Employee",
            encrypted_salary: newEmployee.salary,
          })
          .eq("id", newEmployee.employeeId)
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setEmployees(employees.map(e => e.id === data.id ? data : e));
        }
        
        toast({ title: "Employee Updated", description: "Employee details have been updated" });
      } else if (newEmployee.employeeId) {
        // User selected from user_roles but not in employees table - create new record
        const { data, error } = await supabase
          .from("employees")
          .insert({
            organization_id: profile.currentOrganization.id,
            wallet_address: newEmployee.walletAddress,
            position: newEmployee.position || "Employee",
            status: "pending",
            encrypted_salary: newEmployee.salary,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setEmployees([data, ...employees]);
        }
        
        toast({ title: "Employee Created", description: "Employee has been added to payroll" });
      } else {
        // New employee - create new record
        const { data, error } = await supabase
          .from("employees")
          .insert({
            organization_id: profile.currentOrganization.id,
            wallet_address: newEmployee.walletAddress,
            position: newEmployee.position || "Employee",
            status: "pending",
            encrypted_salary: newEmployee.salary,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setEmployees([data, ...employees]);
        }
        
        toast({ title: "Employee Added", description: "New employee has been added to the payroll" });
      }
      
      handleClearForm();
      setShowAddForm(false);
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

  const handleUpdateRole = async (walletAddress: string, newRole: "manager" | "employee" | "auditor") => {
    if (!profile?.currentOrganization?.id) return;
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("organization_id", profile.currentOrganization.id)
        .eq("user_id", walletAddress);

      if (error) throw error;

      setOrgMembers(prev => prev.map(m => m.user_id === walletAddress ? { ...m, role: newRole } : m));
      toast({ title: "Role Updated", description: `Role changed to ${newRole}` });
    } catch (err) {
      console.error("Error updating role:", err);
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
  };

  const getMemberRole = (walletAddress: string): string => {
    const member = orgMembers.find(m => m.user_id === walletAddress);
    return member?.role || "employee";
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
        <Button onClick={() => { setShowAddForm(!showAddForm); if (!showAddForm) handleClearForm(); }} className="gap-2">
          <Plus className="h-4 w-4" />
          {showAddForm ? "Close Form" : "Add Employee"}
        </Button>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>{newEmployee.employeeId ? "Edit Employee" : "Add New Employee"}</CardTitle>
            <CardDescription>
              {newEmployee.employeeId 
                ? "Update employee details from the list below"
                : `Select from ${orgMembers.length + employees.length} organization members or add a new one`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select Existing Employee */}
            <div>
              <Label>Select Organization Member ({orgMembers.length + employees.length} total)</Label>
              <Select value={selectedEmployeeId} onValueChange={(val) => { setSelectedEmployeeId(val); handleSelectExistingEmployee(val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member to edit" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      👤 {emp.wallet_address.slice(0, 8)}...{emp.wallet_address.slice(-4)} - {emp.position || "Employee"}
                    </SelectItem>
                  ))}
                  {orgMembers.map((member, idx) => (
                    <SelectItem key={`role-${idx}`} value={member.user_id}>
                      🔗 {member.user_id.slice(0, 8)}...{member.user_id.slice(-4)} - {member.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Wallet Address *</Label>
                <Input 
                  placeholder="0x..." 
                  value={newEmployee.walletAddress}
                  onChange={(e) => setNewEmployee({...newEmployee, walletAddress: e.target.value})}
                  disabled={!!selectedEmployeeId}
                  className={selectedEmployeeId ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div>
                <Label>Position</Label>
                <Input 
                  placeholder="Developer" 
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                  disabled={!!selectedEmployeeId}
                  className={selectedEmployeeId ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div>
                <Label>Full Name (Optional - for display)</Label>
                <Input 
                  placeholder="John Doe" 
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
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
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddEmployee}>
                {newEmployee.employeeId ? "Update Employee" : "Add Employee"}
              </Button>
              <Button variant="outline" onClick={() => { handleClearForm(); setShowAddForm(false); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Employee List ({employees.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Employee</th>
                  <th className="text-left py-3 px-4 font-medium">Position</th>
                  <th className="text-left py-3 px-4 font-medium">Salary</th>
                  <th className="text-left py-3 px-4 font-medium">Wallet</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold">{getEmployeeName(emp).charAt(0)}</span>
                        </div>
                        <span className="font-medium">{getEmployeeName(emp)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{emp.position || "—"}</td>
                    <td className="py-3 px-4 font-semibold">${getEmployeeSalary(emp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-xs">{emp.wallet_address.slice(0, 10)}...</td>
                    <td className="py-3 px-4">
                      <Badge variant={emp.status === "active" ? "default" : "secondary"}>
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleSelectEmployeeFromList(emp)}
                        >
                          <UserPlus className="h-3 w-3" />
                          {selectedEmployeeId === emp.id ? "Selected" : "Select"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployee(emp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {employees.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No employees found. Add your first employee above.</p>
          )}
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