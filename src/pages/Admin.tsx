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
import { Users, DollarSign, Building2, Loader2, Copy, CheckCircle, MailPlus, Settings, Send } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

interface MemberWithRole {
  id: string;
  wallet_address: string;
  position: string | null;
  department: string | null;
  encrypted_salary: string | null;
  status: string | null;
  role: string;
}

const AdminDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithRole[]>([]);
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
    const fetchMembers = async () => {
      if (!profile?.currentOrganization?.id) {
        console.log("No organization found. Profile:", profile);
        return;
      }

      console.log("Fetching members for org:", profile.currentOrganization.id);
      try {
        // Get employees with their roles from user_roles
        const { data: employees, error: empError } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);

        if (empError) throw empError;

        // Get roles for these employees
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);

        if (roleError) throw roleError;

        // Combine employee data with roles
        const combined = (employees || []).map(emp => {
          const role = roles?.find(r => r.user_id === emp.wallet_address);
          return {
            id: emp.id,
            wallet_address: emp.wallet_address,
            position: emp.position,
            department: emp.department,
            encrypted_salary: emp.encrypted_salary,
            status: emp.status,
            role: role?.role || "employee",
            user_id: emp.wallet_address,
          };
        });

        console.log("Members query result:", combined);
        setMembers(combined);
        setInviteCode(profile.currentOrganization.invite_code || "");
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [profile?.currentOrganization?.id, profile?.currentOrganization?.invite_code]);

  const activeCount = members.filter(m => m.status === "active").length;
  const totalSalary = members.reduce((sum, m) => sum + (Number(m.encrypted_salary) || 0), 0);

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
      
      toast({ 
        title: "Invitation Sent", 
        description: `Invitation sent to ${inviteEmail}` 
      });
      setInviteEmail("");
    } catch (err) {
      console.error("Error sending invitation:", err);
      toast({ title: "Error", description: "Failed to send invitation", variant: "destructive" });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleUpdateRole = async (memberId: string) => {
    try {
      // Find the member to get their wallet address
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      // Update role in user_roles table
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as any })
        .eq("user_id", member.wallet_address)
        .eq("organization_id", profile?.currentOrganization?.id);

      if (error) throw error;
      
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
      setEditingRole(null);
      setNewRole("");
      toast({ title: "Role Updated", description: "Member role has been updated" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
  };

  const handleAddEmployee = async (memberId: string) => {
    // This would open a dialog to add employee details
    toast({ title: "Coming Soon", description: "Add employee form coming soon" });
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
            <div className="text-3xl font-bold">{members.length}</div>
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
          <p className="text-sm text-muted-foreground">
            The employee will receive an invitation and can join through the Auth page.
          </p>
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
          {members.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No employees found</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.position || "Employee"}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.wallet_address?.slice(0, 10)}...{member.wallet_address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">${Number(member.encrypted_salary || 0).toLocaleString()}/mo</p>
                      <Badge variant="secondary">{member.status || "active"}</Badge>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
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
                          <option value="pending">Pending</option>
                        </select>
                        <Button size="sm" onClick={() => handleUpdateRole(member.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setEditingRole(member.id);
                          setNewRole(member.role);
                        }}
                      >
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