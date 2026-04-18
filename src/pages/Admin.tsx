import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { 
  Users, Plus, Send, Copy, DollarSign, FileText, Settings, 
  UserPlus, Shield, TrendingUp, CheckCircle, Clock, Building, RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { organizationService } from "@/lib/organization-service";

type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

interface OrgStats {
  totalEmployees: number;
  totalPayroll: number;
  pendingApprovals: number;
}

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteCode, setInviteCode] = useState("");
  const [pendingRequests, setPendingRequests] = useState<UserRole[]>([]);
  const [stats, setStats] = useState<OrgStats>({
    totalEmployees: 0,
    totalPayroll: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadOrgData = async () => {
    if (!profile?.currentOrganization?.id) return;
    
    try {
      const orgId = profile.currentOrganization.id;
      
      // Get invite code
      const code = await organizationService.getOrganizationInviteCode(orgId);
      setInviteCode(code || "");
      
      // Get pending join requests (role = 'pending')
      const pending = await organizationService.getPendingJoinRequests(orgId);
      setPendingRequests(pending);
      
      // Get employees count
      const { count: empCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);
      
      // Get total payroll
      const { data: employees } = await supabase
        .from("employees")
        .select("encrypted_salary")
        .eq("organization_id", orgId)
        .eq("status", "active");
      
      const totalSalary = employees?.reduce((sum, e) => sum + (Number(e.encrypted_salary) || 0), 0) || 0;
      
      // Update stats
      setStats({
        totalEmployees: empCount || 0,
        totalPayroll: totalSalary,
        pendingApprovals: pending.length,
      });
    } catch (error) {
      console.error("Error loading org data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadOrgData();
  }, [profile?.currentOrganization?.id]);

  const handleInvite = async () => {
    if (!inviteEmail || !profile?.currentOrganization?.id) return;
    
    try {
      await organizationService.createInvitation({
        organizationId: profile.currentOrganization.id,
        role: inviteRole,
        email: inviteEmail,
        createdBy: profile.walletAddress,
      });
      
      toast({ title: "Invitation sent", description: `Invite sent to ${inviteEmail}` });
      setInviteEmail("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to send invitation", variant: "destructive" });
    }
  };

  const handleApprove = async (userId: string, role: "employee" | "manager" | "auditor" = "employee") => {
    if (!profile?.currentOrganization?.id) return;
    
    try {
      await organizationService.approveJoinRequest(userId, profile.currentOrganization.id, role);
      toast({ title: "Approved", description: "User has been granted access" });
      loadOrgData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve", variant: "destructive" });
    }
  };

  const handleReject = async (userId: string) => {
    if (!profile?.currentOrganization?.id) return;
    
    try {
      await organizationService.rejectJoinRequest(userId, profile.currentOrganization.id);
      toast({ title: "Rejected", description: "Access request denied" });
      loadOrgData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject", variant: "destructive" });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast({ title: "Copied!", description: "Invite code copied to clipboard" });
  };

  const handleRegenerateCode = async () => {
    if (!profile?.currentOrganization) return;
    
    try {
      const newCode = await organizationService.regenerateInviteCode(profile.currentOrganization.id);
      setInviteCode(newCode);
      toast({ title: "Code Regenerated", description: "New invite code generated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to regenerate code", variant: "destructive" });
    }
  };

  if (!profile?.currentOrganization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No organization found</p>
      </div>
    );
  }

  const quickActions = [
    { icon: UserPlus, label: "Invite User", action: () => {}, color: "bg-blue-500" },
    { icon: DollarSign, label: "Process Payroll", action: () => navigate("/admin/payroll"), color: "bg-green-500" },
    { icon: FileText, label: "Add Employee", action: () => navigate("/admin/payroll?add=true"), color: "bg-purple-500" },
    { icon: Settings, label: "Settings", action: () => navigate("/admin/settings"), color: "bg-gray-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">{profile.currentOrganization.name}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Building className="h-4 w-4 mr-1" />
          {profile.currentOrganization.name}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payroll</p>
              <p className="text-2xl font-bold">${stats.totalPayroll.toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card key={action.label} className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center gap-2" onClick={action.action}>
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invite Section */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5" /> Invite New Members
            </CardTitle>
            <CardDescription>Invite employees or managers to your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Email address" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} className="w-full" disabled={!inviteEmail}>
              Send Invite
            </Button>

            {inviteCode && (
              <div className="border-t pt-4">
                <Label className="text-sm text-muted-foreground">Organization Invite Code:</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 font-mono bg-muted px-3 py-2 rounded">{inviteCode}</code>
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleRegenerateCode} title="Regenerate code">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Join Requests */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Pending Access Requests
            </CardTitle>
            <CardDescription>Users waiting for approval to join your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{req.user_id.slice(0, 8)}...{req.user_id.slice(-4)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleApprove(req.user_id)}>Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReject(req.user_id)}>Reject</Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No pending access requests</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;