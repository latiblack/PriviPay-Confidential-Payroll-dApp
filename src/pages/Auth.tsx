import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, ArrowRight, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";
import { organizationService } from "@/lib/organization-service";

type AuthStep = "select" | "create-org" | "join-org" | "success";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, walletAddress, connectWallet, user } = useWalletAuth();
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<AuthStep>("select");
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdOrg, setCreatedOrg] = useState<{ name: string; code: string } | null>(null);
  
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [validatedOrg, setValidatedOrg] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const checkExistingOrg = async () => {
      console.log("Auth check:", { isAuthenticated, walletAddress, hasProfile: !!profile, user });
      
      if (isAuthenticated && walletAddress) {
        try {
          await refreshProfile();
          if (profile?.currentRole === "owner") {
            navigate("/admin");
            return;
          }
          // If user is authenticated and has a wallet but no org, show the select screen
          if (profile && profile.currentRole) {
            navigate(`/${profile.currentRole === "employee" ? "employee" : "admin"}`);
            return;
          }
        } catch (e) {
          console.log("No existing organization - will show create/join screen");
        }
      } else if (isAuthenticated && user && !walletAddress) {
        // User authenticated (email) but waiting for wallet to be created
        console.log("User authenticated, waiting for wallet...");
      }
      setLoading(false);
    };
    checkExistingOrg();
  }, [isAuthenticated, walletAddress, user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your secure environment...</p>
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
              Please wait while we create your secure wallet. This will enable FHE-encrypted salary payments.
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
      const org = await organizationService.findOrgByInviteCode(inviteCode);
      if (org) {
        setValidatedOrg({ id: org.id, name: org.name });
      } else {
        setJoinError("Invalid invite code. Please check and try again.");
      }
    } catch (error) {
      setJoinError("Failed to validate invite code");
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
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Sign in with email to get a secure wallet automatically, or connect your existing wallet
              </p>
              {/* Dynamic Widget will show email + wallet options */}
              <div id="dynamic-auth-container"></div>
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
                        setJoinError("Failed to join organization");
                      }
                    }
                  }} className="flex-1">Join Organization</Button>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default AuthPage;