import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Users, DollarSign, Building2, Loader2, Copy, CheckCircle, MailPlus, Settings } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

const AdminDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!profile?.currentOrganization?.id) return;

      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);

        if (error) throw error;
        setEmployees(data || []);
        setInviteCode(profile.currentOrganization.invite_code || "");
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [profile?.currentOrganization?.id, profile?.currentOrganization?.invite_code]);

  const totalSalary = employees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
  const activeCount = employees.filter(e => e.status === "active").length;

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Invite code copied to clipboard" });
  };

  const handleUpdateRole = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from("employees")
        .update({ role: newRole })
        .eq("id", employeeId);

      if (error) throw error;
      
      setEmployees(prev => prev.map(e => 
        e.id === employeeId ? { ...e, role: newRole } : e
      ));
      setEditingRole(null);
      setNewRole("");
      toast({ title: "Role Updated", description: "Employee role has been updated" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Monthly Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalSalary.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Active Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{profile?.currentOrganization?.name}</div>
            <Badge variant="outline" className="mt-1">{profile?.currentRole}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Organisation Invite Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Organisation Invite Code
          </CardTitle>
          <CardDescription>Share this code with employees to join your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-muted rounded-lg font-mono text-xl tracking-wider text-center">
              {inviteCode || "No invite code"}
            </div>
            <Button onClick={handleCopyInviteCode} variant="outline" size="lg">
              {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite Employee Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailPlus className="h-5 w-5" />
            Invite Employee
          </CardTitle>
          <CardDescription>Send an invite link to prospective employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Share this link:</p>
              <p className="font-mono text-sm">https://privipay.app/auth?invite={inviteCode || 'CODE'}</p>
            </div>
            <Button variant="outline" onClick={handleCopyInviteCode}>
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List of Employees with Role Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Employees
          </CardTitle>
          <CardDescription>View and manage employee roles</CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No employees found</p>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{emp.position || "Employee"}</p>
                      <p className="text-sm text-muted-foreground">
                        {emp.wallet_address?.slice(0, 10)}...{emp.wallet_address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">${Number(emp.salary || 0).toLocaleString()}/mo</p>
                      <Badge variant="secondary">{emp.status}</Badge>
                    </div>
                    {editingRole === emp.id ? (
                      <div className="flex items-center gap-2">
                        <select 
                          value={newRole} 
                          onChange={(e) => setNewRole(e.target.value)}
                          className="p-2 border rounded"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="auditor">Auditor</option>
                        </select>
                        <Button size="sm" onClick={() => handleUpdateRole(emp.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{emp.role || "employee"}</Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingRole(emp.id);
                            setNewRole(emp.role || "employee");
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;