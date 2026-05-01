import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MailPlus, Check, X, Building2, UserCheck } from "lucide-react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface Invitation {
  id: string;
  organization_id: string;
  role: string;
  status: string;
  created_at: string;
  organizations?: {
    name: string;
    description: string;
  };
}

const PendingInvitations = () => {
  const { walletAddress } = useWalletAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitations = async () => {
      if (!walletAddress) return;

      try {
        const { data, error } = await supabase
          .from("invitations")
          .select(`
            id,
            organization_id,
            role,
            status,
            created_at,
            organizations:organization_id (name, description)
          `)
          .eq("wallet_address", walletAddress.toLowerCase())
          .eq("status", "pending");

        if (error) throw error;
        setInvitations(data || []);
      } catch (err) {
        console.error("Error fetching invitations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [walletAddress]);

  const handleInvitationResponse = async (invitationId: string, action: "accept" | "reject") => {
    if (!walletAddress) return;
    
    setProcessing(invitationId);
    try {
      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation) return;

      if (action === "accept") {
        // Add user to organization with the role specified in invitation
        await supabase
          .from("user_roles")
          .insert({
            organization_id: invitation.organization_id,
            user_id: walletAddress.toLowerCase(),
            role: invitation.role as any,
          });

        // Update invitation status
        await supabase
          .from("invitations")
          .update({ status: "accepted" })
          .eq("id", invitationId);

        toast({ title: "Invitation Accepted", description: "You have joined the organization!" });
      } else {
        // Reject invitation
        await supabase
          .from("invitations")
          .update({ status: "rejected" })
          .eq("id", invitationId);

        toast({ title: "Invitation Declined" });
      }

      // Remove from list
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    } catch (err) {
      console.error("Error responding to invitation:", err);
      toast({ title: "Error", description: "Failed to respond to invitation", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Pending Invitations</h1>
          <p className="text-muted-foreground mt-1">
            You have {invitations.length} pending invitation{invitations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {invitations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MailPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No pending invitations</p>
              <p className="text-sm text-muted-foreground mt-2">
                When someone invites you to their organization, you'll see it here.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {invitation.organizations?.name || "Unknown Organization"}
                    </CardTitle>
                    <Badge variant="outline">{invitation.role}</Badge>
                  </div>
                  <CardDescription>
                    {invitation.organizations?.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleInvitationResponse(invitation.id, "reject")}
                      disabled={processing === invitation.id}
                    >
                      {processing === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </>
                      )}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleInvitationResponse(invitation.id, "accept")}
                      disabled={processing === invitation.id}
                    >
                      {processing === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingInvitations;