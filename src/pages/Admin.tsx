import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import organizationService from "@/lib/organization-service";
import { Users, DollarSign, Building2, Loader2, Copy, CheckCircle, MailPlus, Settings, Send, Plus, UserCheck } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

const AdminDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { toast } = useToast();
  
  // Employees in payroll (from employees table)
  const [payrollEmployees, setPayrollEmployees] = useState<Employee[]>([]);
  
  // All members (from user_roles - people who joined via invite)
  const [members, setMembers] = useState<UserRole[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");
  
  // Email invitation state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.currentOrganization?.id) return;

      try {
        // Get employees in payroll
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);

        if (empError) throw empError;
        setPayrollEmployees(empData || []);

        // Get all members from user_roles
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);

        if (roleError) throw roleError;
        setMembers(roleData || []);
        
        setInviteCode(profile.currentOrganization.invite_code || "");
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.currentOrganization?.id]);

  // Refresh data when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (profile?.currentOrganization?.id) {
        supabase
          .from("user_roles")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .then(({ data }) => {
            if (data) setMembers(data);
          });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [profile?.currentOrganization?.id]);

  // Get employee data for a member
  const getEmployeeData = (userId: string) => {
    return payrollEmployees.find(emp => emp.wallet_address === userId);
  };

  // Check if member is in payroll (has salary > 0)
  const isInPayroll = (userId: string) => {
    const emp = getEmployeeData(userId);
    return emp && Number(emp.encrypted_salary) > 0;
  };

  // Add member to payroll
  const handleAddToPayroll = async (member: UserRole) => {
    try {
      const { error } = await supabase
        .from("employees")
        .insert({
          organization_id: profile?.currentOrganization?.id,
          wallet_address: member.user_id,
          position: member.role,
          status: "active",
          encrypted_salary: "0",
        });

      if (error) throw error;

      // Refresh data
      const { data: empData } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", profile?.currentOrganization?.id);
      setPayrollEmployees(empData || []);

      toast({ title: "Added to Payroll", description: "Employee has been added to payroll" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add to payroll", variant: "destructive" });
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Invite code copied to clipboard" });
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail || !profile?.currentOrganization?.id || !walletAddress) return;
    
    setSendingInvite(true);
    try {
      await organizationService.createInvitation({
        organizationId: profile.currentOrganization.id,
        email: inviteEmail,
        role: inviteRole,
        createdBy: walletAddress,
      });
      
      toast({ title: "Invitation Sent", description: `Invitation sent to ${inviteEmail}` });
      setInviteEmail("");
    } catch (err) {
      toast({ title: "Error", description: "Failed to send invitation", variant: "destructive" });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleUpdateRole = async (memberId: string) => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as any })
        .eq("id", memberId);

      if (error) throw error;
      
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole as any } : m));
      setEditingRole(null);
      toast({ title: "Role Updated", description: "Member role has been updated" });
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
        <p className="text-muted-foreground">Manage your organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{members.length}</div>
          </CardContent>
        </Card>

<Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          In Payroll (with salary)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {payrollEmployees.filter(e => Number(e.encrypted_salary) > 0).length}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Not in Payroll
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {members.length - payrollEmployees.filter(e => Number(e.encrypted_salary) > 0).length}
        </div>
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

      {/* Invite Employee Card with Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailPlus className="h-5 w-5" />
            Invite Employee
          </CardTitle>
          <CardDescription>Send an invitation email to a prospective employee</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="employee@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select 
                className="w-full p-2 border rounded-md"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSendInvitation} 
                disabled={sendingInvite || !inviteEmail}
                className="w-full gap-2"
              >
                {sendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Invitation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

{/* All Members - Role Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Members
          </CardTitle>
          <CardDescription>Manage member roles in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No members yet. Invite employees above.</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">Member</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {member.user_id?.slice(0, 12)}...{member.user_id?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-lg px-3 py-1">{member.role}</Badge>

                    {editingRole === member.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="p-2 border rounded"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="auditor">Auditor</option>
                          <option value="owner">Owner</option>
                        </select>
                        <Button size="sm" onClick={() => handleUpdateRole(member.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => { setEditingRole(member.id); setNewRole(member.role); }}>
                        <Settings className="h-4 w-4" />
                      </Button>
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