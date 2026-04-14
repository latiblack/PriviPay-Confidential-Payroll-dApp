import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Plus, Send, Copy, DollarSign, FileText, Settings, 
  UserPlus, Shield, TrendingUp, CheckCircle, Clock 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

const pendingInvitations = [
  { id: "1", email: "john@example.com", role: "employee", status: "pending", date: "2026-04-10" },
  { id: "2", email: "jane@example.com", role: "manager", status: "pending", date: "2026-04-12" },
];

const recentActivity = [
  { action: "Alice Johnson joined", time: "2 hours ago" },
  { action: "March payroll processed", time: "1 day ago" },
  { action: "Q1 bonus voting completed", time: "3 days ago" },
];

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteCode] = useState("ABCD-1234-EFGH");

  const handleInvite = () => {
    if (!inviteEmail) return;
    toast({ title: "Invitation sent", description: `Invite sent to ${inviteEmail}` });
    setInviteEmail("");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast({ title: "Copied!", description: "Invite code copied to clipboard" });
  };

  const quickActions = [
    { icon: UserPlus, label: "Invite User", path: "#", color: "bg-blue-500" },
    { icon: DollarSign, label: "Process Payroll", path: "#", color: "bg-green-500" },
    { icon: FileText, label: "Add Employee", path: "#", color: "bg-purple-500" },
    { icon: Settings, label: "Settings", path: "#", color: "bg-gray-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization</p>
        </div>
        {profile?.currentOrganization && (
          <Badge variant="outline" className="text-sm">
            {profile.currentOrganization.name}
          </Badge>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card key={action.label} className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center gap-2">
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

            <div className="border-t pt-4">
              <Label className="text-sm text-muted-foreground">Or share invite code:</Label>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 font-mono bg-muted px-3 py-2 rounded">{inviteCode}</code>
                <Button variant="outline" size="icon" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Pending Invitations
            </CardTitle>
            <CardDescription>Users waiting for approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvitations.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">{invite.role} • {invite.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Approve</Button>
                  <Button size="sm" variant="ghost">Reject</Button>
                </div>
              </div>
            ))}
            {pendingInvitations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No pending invitations</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{activity.action}</span>
                <span className="text-xs text-muted-foreground ml-auto">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;