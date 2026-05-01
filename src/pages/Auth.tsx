import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, ArrowRight, CheckCircle2, Copy, Loader2, Wallet, Mail } from "lucide-react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";
import { organizationService } from "@/lib/organization-service";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { supabase } from "@/integrations/supabase/client";

type AuthStep = "select" | "create-org" | "join-org" | "success";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, walletAddress, connectWallet, user } = useWalletAuth();
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<AuthStep>("select");
  const [loading, setLoading] = useState(true);

  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdOrg, setCreatedOrg] = useState<{ name: string; code: string } | null>(null);
  
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [validatedOrg, setValidatedOrg] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [checkingInvites, setCheckingInvites] = useState(true);

// Check for pending email invitations
  useEffect(() => {
    const checkPendingInvitations = async () => {
      if (isAuthenticated && walletAddress) {
        console.log("Checking pending invitations for:", walletAddress);
        setCheckingInvites(true);
        try {
          const allInvitations: any[] = [];

          // Get user email from Dynamic if available
          const userEmail = (user as any)?.email;

          if (userEmail) {
            // Fetch pending invitations for this email
            const { data: emailInvitations, error } = await supabase
              .from("invitations")
              .select("*")
              .eq("email", userEmail.toLowerCase())
              .eq("status", "pending");

            console.log("Email invitations:", emailInvitations, error);
            if (!error && emailInvitations) {
              allInvitations.push(...emailInvitations);
            }
          }

          // Check for wallet-based invitations
          console.log("Checking wallet invitations for:", walletAddress.toLowerCase());
          const { data: walletInvitations, error: walletError } = await supabase
            .from("invitations")
            .select("*")
            .eq("wallet_address", walletAddress.toLowerCase())
            .eq("status", "pending");

          console.log("Wallet invitations:", walletInvitations, walletError);
          if (!walletError && walletInvitations) {
            allInvitations.push(...walletInvitations);
          }

          console.log("Total invitations found:", allInvitations.length);

          if (allInvitations.length > 0) {
            // Get organization names
            const orgIds = [...new Set(allInvitations.map(i => i.organization_id))];
            const { data: orgs } = await supabase
              .from("organizations")
              .select("id, name, description")
              .in("id", orgIds);

            const orgMap = new Map(orgs?.map(o => [o.id, { name: o.name, description: o.description }]) || []);

            const formatted = allInvitations.map(inv => ({
              ...inv,
              organization_name: orgMap.get(inv.organization_id)?.name || "Organization",
              organization_description: orgMap.get(inv.organization_id)?.description || ""
            }));

            console.log("Setting pending invitations:", formatted);
            setPendingInvitations(formatted);
          } else {
            setPendingInvitations([]);
          }
        } catch (e) {
          console.log("Error checking invitations:", e);
        }
      }
      setCheckingInvites(false);
    };
    checkPendingInvitations();
  }, [isAuthenticated, walletAddress]);

  useEffect(() => {
    const checkExistingOrg = async () => {
      console.log("Auth check:", { isAuthenticated, walletAddress, user });
      
      // Only check if we have a wallet address
      if (!walletAddress) {
        setLoading(false);
        return;
      }
      
      try {
        // Always refresh profile from DB to get the latest role
        const freshProfile = await refreshProfile();
        console.log("Fresh profile from DB:", freshProfile);
        
        // If no profile yet, show create/join screen
        if (!freshProfile) {
          console.log("No profile - showing create/join screen");
          setLoading(false);
          return;
        }
        
        const role = freshProfile.currentRole as string | null;
        const org = freshProfile.currentOrganization;
        
        console.log("Role:", role, "Org:", org);
        
        if (role === "owner" && org) {
          navigate("/admin");
          return;
        }
        // If user is pending, go to pending page
        if (role === "pending") {
          navigate("/pending");
          return;
        }
        // If user has a valid role (employee, manager, auditor), go to their dashboard
        if (role && role !== "pending" && org) {
          navigate("/employee");
          return;
        }
        // If we have a role but no org yet, show create/join screen
        // No need to navigate - just show the screen
      } catch (e) {
        console.log("Error loading profile:", e);
      }
      setLoading(false);
    };
    
    // Only run when we have wallet address
    if (walletAddress) {
      checkExistingOrg();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, walletAddress]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Wallet className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">PriviPay</h2>
            <p className="text-sm text-muted-foreground">Setting up your secure environment</p>
          </div>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated but waiting for embedded wallet to be created
  if (isAuthenticated && user && !walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Creating Your Wallet</CardTitle>
            <CardDescription>Setting up your secure wallet for confidential payroll</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we create your secure wallet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateOrg = async () => {
    if (!walletAddress || !orgName) return;
    setCreating(true);
    try {
      const org = await organizationService.createOrganization({
        name: orgName,
        description: orgDescription,
        ownerWalletAddress: walletAddress,
        ownerId: walletAddress,
      });
      
      const invitation = await organizationService.createInvitation({
        organizationId: org.id,
        role: "employer",
        createdBy: walletAddress,
      });
      
      setCreatedOrg({ name: org.name, code: invitation.code });
      await refreshProfile();
      setStep("success");
    } catch (error) {
      console.error("Error creating organization:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleValidateInvite = async () => {
    if (!inviteCode) return;
    setJoining(true);
    setJoinError("");
    setValidatedOrg(null);
    
    try {
      // Keep the dashes - just convert to uppercase
      const codeInput = inviteCode.toUpperCase().trim();
      
      // First, let's see what invite codes exist in the database
      const { data: allOrgs } = await supabase
        .from("organizations")
        .select("id, name, invite_code")
        .limit(5);
      
      // Log to UI for debugging
      console.log("Looking for invite code:", codeInput);
      console.log("Sample orgs in DB:", allOrgs);
      
      const { data: org, error } = await supabase
        .from("organizations")
        .select("id, name, description, invite_code")
        .eq("invite_code", codeInput)
        .single();
      
      console.log("Org lookup result:", { org, error });
      
      if (error || !org) {
        // Show more helpful error
        if (allOrgs && allOrgs.length > 0) {
          setJoinError(`Code not found. Available codes: ${allOrgs.map(o => o.invite_code).join(', ')}`);
        } else {
          setJoinError("No organizations exist yet.");
        }
      } else {
        setValidatedOrg({ id: org.id, name: org.name, description: org.description });
      }
    } catch (error: any) {
      console.error("Error validating invite:", error);
      setJoinError(error.message || "Failed to validate invite code");
    } finally {
      setJoining(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

if (!isAuthenticated) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to PriviPay</CardTitle>
          <CardDescription>Sign in to manage your confidential payroll</CardDescription>
        </CardHeader>
<CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground text-center">
          Connect your wallet to get started
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </CardContent>
      </Card>
    </div>
  );
}

  if (step === "success" && createdOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Organization Created!</CardTitle>
            <CardDescription>{createdOrg.name} has been created successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Share this invite code with your team</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-lg font-bold">{createdOrg.code}</code>
                <Button variant="ghost" size="icon" onClick={() => handleCopyCode(createdOrg.code)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={() => navigate("/admin")} className="w-full" size="lg">
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to PriviPay</CardTitle>
          <CardDescription>
            {step === "select" ? "Choose how you'd like to get started" : step === "create-org" ? "Set up your organization" : "Join your team"}
          </CardDescription>
        </CardHeader>
        
        {step === "select" && (
          <CardContent className="space-y-4">
            <Button onClick={() => setStep("create-org")} className="w-full h-auto py-6 flex flex-col items-start gap-2" variant="outline">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Create Organization</p>
                  <p className="text-sm text-muted-foreground">Set up confidential payroll for your team</p>
                </div>
              </div>
            </Button>
            <Button onClick={() => setStep("join-org")} className="w-full h-auto py-6 flex flex-col items-start gap-2" variant="outline">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Join Organization</p>
                  <p className="text-sm text-muted-foreground">Access your salary and payments securely</p>
                </div>
              </div>
            </Button>
          </CardContent>
        )}
        
        {step === "create-org" && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" placeholder="Acme Corporation" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgDescription">Description (Optional)</Label>
              <Textarea id="orgDescription" placeholder="Brief description of your organization" value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select")} className="flex-1">Back</Button>
              <Button onClick={handleCreateOrg} disabled={!orgName || creating} className="flex-1">
                {creating ? "Creating..." : "Create Organization"}
              </Button>
            </div>
          </CardContent>
        )}
        
{step === "join-org" && (
  <CardContent className="space-y-4">
    {checkingInvites ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : (
      <>
        {/* Pending Invitations at the top */}
        {pendingInvitations.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">You have pending invitations:</p>
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="border rounded-lg p-4 space-y-2">
                <p className="font-semibold text-lg">{inv.organization_name}</p>
                {inv.organization_description && (
                  <p className="text-sm text-muted-foreground">{inv.organization_description}</p>
                )}
                <p className="text-xs text-muted-foreground">Role: {inv.role}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (walletAddress) {
                        try {
                          setJoining(true);
                          await organizationService.acceptInvitation(inv.code, walletAddress, walletAddress);
                          const freshProfile = await refreshProfile();
                          console.log("After accept - profile:", freshProfile);
                          navigate("/employee");
                        } catch (e) {
                          console.error("Accept error:", e);
                          setJoinError("Failed to accept invitation");
                        } finally {
                          setJoining(false);
                        }
                      }
                    }}
                    disabled={joining}
                    className="flex-1"
                  >
                    {joining ? "..." : "Accept"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        setJoining(true);
                        await organizationService.rejectInvitation(inv.id);
                        setPendingInvitations(prev => prev.filter(i => i.id !== inv.id));
                      } catch (e) {
                        setJoinError("Failed to reject invitation");
                      } finally {
                        setJoining(false);
                      }
                    }}
                    disabled={joining}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or enter invite code</span>
              </div>
            </div>
          </>
        )}

        {/* Invite Code Input */}
        {!validatedOrg ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input id="inviteCode" placeholder="XXXX-XXXX-XXXX" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="text-center font-mono text-lg tracking-widest" />
            </div>
            {joinError && <p className="text-sm text-destructive">{joinError}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select")} className="flex-1">Back</Button>
              <Button onClick={handleValidateInvite} disabled={!inviteCode || joining} className="flex-1">
                {joining ? "Validating..." : "Continue"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">You're joining:</p>
              <p className="font-semibold text-lg">{validatedOrg.name}</p>
              {validatedOrg.description && (
                <p className="text-sm text-muted-foreground mt-2">{validatedOrg.description}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Your request will be pending until an admin approves it.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setValidatedOrg(null); setInviteCode(""); }} className="flex-1">Back</Button>
              <Button onClick={async () => {
                if (walletAddress) {
                  try {
                    await organizationService.joinWithOrgCode(inviteCode, walletAddress, walletAddress);
                    navigate("/pending");
                  } catch (e) {
                    console.error("Join error:", e);
                    setJoinError("Failed to join organization");
                  }
                }
              }} className="flex-1">Join Organization</Button>
            </div>
          </>
        )}
      </>
    )}
  </CardContent>
)}
      </Card>
    </div>
  );
};

export default AuthPage;