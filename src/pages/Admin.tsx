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
import { Users, DollarSign, Building2, Loader2, Copy, CheckCircle, MailPlus, Settings, Send, Plus, UserCheck, Trash2, AlertTriangle } from "lucide-react";

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

  // Delete member state
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<{ [key: string]: number }>({});

  // Wallet invitation state
  const [inviteWallet, setInviteWallet] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Pending invitations and join requests
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

const handleRemoveMember = async (memberId: string) => {
    const currentStep = deleteConfirmStep[memberId] || 0;

    if (currentStep === 0) {
      // First click - show warning (don't set deletingMember yet)
      setDeleteConfirmStep({ ...deleteConfirmStep, [memberId]: 1 });
      return;
    }

    // Second click - actually delete
    setDeletingMember(memberId);
    try {
      // Delete from user_roles
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      // Also remove from employees if exists
      await supabase
        .from("employees")
        .delete()
        .eq("user_id", members.find(m => m.id === memberId)?.user_id);

      toast({ title: "Member removed", description: "Member has been removed from the organization" });
      setDeleteConfirmStep({ ...deleteConfirmStep, [memberId]: 0 });
      setDeletingMember(null);
      fetchData();
    } catch (err) {
      console.error("Error removing member:", err);
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
    } finally {
      setDeletingMember(null);
    }
  };

  const cancelDelete = (memberId: string) => {
    setDeleteConfirmStep({ ...deleteConfirmStep, [memberId]: 0 });
  };

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

  // Fetch pending invitations and join requests
  useEffect(() => {
    if (profile?.currentOrganization?.id && walletAddress) {
      fetchPendingInvitations();
      fetchJoinRequests();
    }
  }, [profile?.currentOrganization?.id, walletAddress]);

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
    if (!inviteWallet || !profile?.currentOrganization?.id || !walletAddress) return;

    setSendingInvite(true);
    try {
      const invitation = await organizationService.createInvitation({
        organizationId: profile.currentOrganization.id,
        walletAddress: inviteWallet,
        role: inviteRole,
        createdBy: walletAddress,
      });

      // Send notification to the invited wallet address
      await supabase.from("notifications").insert({
        organization_id: profile.currentOrganization.id,
        user_id: inviteWallet.toLowerCase(),
        title: "New Invitation",
        message: `You have been invited to join ${profile.currentOrganization.name} as ${inviteRole}`,
        type: "invitation_sent",
        read: false,
      });

      toast({ title: "Invitation Sent", description: `Invitation sent to ${inviteWallet.slice(0, 6)}...${inviteWallet.slice(-4)}` });
      setInviteWallet("");
      
      // Refresh pending invitations
      fetchPendingInvitations();
    } catch (err) {
      console.error("Error sending invitation:", err);
      toast({ title: "Error", description: "Failed to send invitation", variant: "destructive" });
    } finally {
      setSendingInvite(false);
    }
  };

  // Fetch pending invitations sent by this org
  const fetchPendingInvitations = async () => {
    if (!profile?.currentOrganization?.id) return;
    
    const { data } = await supabase
      .from("invitations")
      .select("*")
      .eq("organization_id", profile.currentOrganization.id)
      .eq("status", "pending")
      .eq("created_by", walletAddress);
    
    if (data) setPendingInvitations(data);
  };

// Fetch join requests (users who want to join via org invite code)
  const fetchJoinRequests = async () => {
    if (!profile?.currentOrganization?.id) {
      console.log("No org ID found:", profile?.currentOrganization);
      return;
    }

    console.log("Fetching for org ID:", profile.currentOrganization.id);

    // First, let's get ALL user_roles for this org to debug
    const { data: allRoles, error: allRolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("organization_id", profile.currentOrganization.id);

    console.log("All user_roles for org:", allRoles, "error:", allRolesError);

    // Then filter for pending
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("organization_id", profile.currentOrganization.id)
      .eq("role", "pending");

    console.log("Pending join requests:", data, "error:", error);
    if (data) setJoinRequests(data);
  };

  // Handle join request (accept/reject)
  const handleJoinRequest = async (userId: string, action: "accept" | "reject") => {
    const lowerUserId = userId.toLowerCase();
    setProcessingRequest(userId);
    try {
      if (action === "accept") {
        // Add user to organization
        await supabase
          .from("user_roles")
          .update({ role: "staff" as any })
          .eq("user_id", lowerUserId)
          .eq("organization_id", profile?.currentOrganization?.id);

        // Send notification to user
        await supabase.from("notifications").insert({
          organization_id: profile?.currentOrganization?.id,
          user_id: lowerUserId,
          title: "Join Request Approved",
          message: `Your request to join ${profile?.currentOrganization?.name} has been approved!`,
          type: "join_approved",
          read: false,
        });

        toast({ title: "Request Approved", description: "User has been added to the organization" });
      } else {
        // Remove the pending request
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", lowerUserId)
          .eq("organization_id", profile?.currentOrganization?.id);

        // Send notification to user
        await supabase.from("notifications").insert({
          organization_id: profile?.currentOrganization?.id,
          user_id: lowerUserId,
          title: "Join Request Rejected",
          message: `Your request to join ${profile?.currentOrganization?.name} has been rejected.`,
          type: "join_rejected",
          read: false,
        });

        toast({ title: "Request Rejected", description: "Join request has been declined" });
      }
      
      fetchJoinRequests();
    } catch (err) {
      console.error("Error handling join request:", err);
      toast({ title: "Error", description: "Failed to process request", variant: "destructive" });
    } finally {
      setProcessingRequest(null);
    }
  };

  // Cancel pending invitation
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await supabase
        .from("invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);
      
      toast({ title: "Invitation Cancelled" });
      fetchPendingInvitations();
    } catch (err) {
      toast({ title: "Error", description: "Failed to cancel invitation", variant: "destructive" });
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg mt-1">Manage your organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{members.length}</div>
            <p className="text-xs opacity-75 mt-1">in organization</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              In Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {payrollEmployees.filter(e => Number(e.encrypted_salary) > 0).length}
            </div>
            <p className="text-xs opacity-75 mt-1">with salary</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Not in Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {members.length - payrollEmployees.filter(e => Number(e.encrypted_salary) > 0).length}
            </div>
            <p className="text-xs opacity-75 mt-1">pending</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{profile?.currentOrganization?.name}</div>
            <Badge variant="secondary" className="mt-1 bg-white/20 text-white border-0">{profile?.currentRole}</Badge>
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

{/* Invite Employee Card by Wallet Address */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MailPlus className="h-5 w-5" />
        Invite Employee
      </CardTitle>
      <CardDescription>Send an invitation by wallet address</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Wallet Address</Label>
          <Input
            placeholder="0x..."
            value={inviteWallet}
            onChange={(e) => setInviteWallet(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="auditor">Auditor</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleSendInvitation}
            disabled={sendingInvite || !inviteWallet}
            className="w-full gap-2"
          >
            {sendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Invitation
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Pending Invitations */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MailPlus className="h-5 w-5" />
        Pending Invitations
      </CardTitle>
      <CardDescription>Invitations sent to wallet addresses</CardDescription>
    </CardHeader>
    <CardContent>
      {pendingInvitations.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground">No pending invitations</p>
      ) : (
        <div className="space-y-2">
          {pendingInvitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-mono text-sm">{inv.wallet_address?.slice(0, 10)}...{inv.wallet_address?.slice(-4)}</p>
                <p className="text-xs text-muted-foreground">Role: {inv.role}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleCancelInvitation(inv.id)}>
                Cancel
              </Button>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>

  {/* Join Requests - Users who want to join via org invite code */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Join Requests
      </CardTitle>
      <CardDescription>Users who requested to join your organization</CardDescription>
    </CardHeader>
    <CardContent>
      {joinRequests.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground">No join requests</p>
      ) : (
        <div className="space-y-2">
          {joinRequests.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-mono text-sm">{req.user_id?.slice(0, 10)}...{req.user_id?.slice(-4)}</p>
                <p className="text-xs text-muted-foreground">Requested to join</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleJoinRequest(req.user_id, "reject")}
                  disabled={processingRequest === req.user_id}
                >
                  Reject
                </Button>
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => handleJoinRequest(req.user_id, "accept")}
                  disabled={processingRequest === req.user_id}
                >
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
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

{deleteConfirmStep[member.id] === 1 ? (
            <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 font-medium">Confirm?</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRemoveMember(member.id)}
                disabled={deletingMember === member.id}
              >
                {deletingMember === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Remove"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelDelete(member.id)}
                disabled={deletingMember === member.id}
              >
                Cancel
              </Button>
            </div>
          ) : (
                      <div className="flex items-center gap-2">
                        {editingRole === member.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="p-2 border rounded"
                            >
                              <option value="staff">Staff</option>
                              <option value="manager">Manager</option>
                              <option value="auditor">Auditor</option>
                              <option value="owner">Owner</option>
                            </select>
                            <Button size="sm" onClick={() => handleUpdateRole(member.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingRole(member.id); setNewRole(member.role); }}>
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveMember(member.id)}
                              title="Remove member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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