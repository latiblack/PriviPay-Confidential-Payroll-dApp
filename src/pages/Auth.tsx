import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, ArrowRight, CheckCircle2, Copy, Wallet } from "lucide-react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";
import { organizationService } from "@/lib/organization-service";
import { authService } from "@/lib/auth-service";

type AuthStep = "select" | "create-org" | "join-org" | "success";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, walletAddress, connectWallet } = useWalletAuth();
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<AuthStep>("select");
  const [loading, setLoading] = useState(true);
  
  // Check if user already has an organization
  useEffect(() => {
    const checkExistingOrg = async () => {
      if (isAuthenticated && walletAddress) {
        try {
          await refreshProfile();
          // If user has an organization and role, redirect to app
          if (profile?.currentRole === "owner") {
            navigate("/admin");
            return;
          } else if (profile?.currentRole === "employee" || profile?.currentRole === "manager") {
            navigate("/employee");
            return;
          }
        } catch (e) {
          console.log("No existing organization");
        }
      }
      setLoading(false);
    };
    
    checkExistingOrg();
  }, [isAuthenticated, walletAddress]);

  // Show loading while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Create org form
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdOrg, setCreatedOrg] = useState<{ name: string; code: string } | null>(null);
  
  // Join org form
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [validatedOrg, setValidatedOrg] = useState<{ id: string; name: string } | null>(null);

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
      
      // Refresh profile to get the new organization
      await authService.login(walletAddress);
      
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
      const result = await organizationService.validateInvitation(inviteCode);
      
      if (result.valid && result.organization) {
        setValidatedOrg(result.organization);
      } else {
        setJoinError(result.error || "Invalid invite code");
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
            <CardTitle className="text-2xl">Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to get started with PriviPay
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={connectWallet} 
              className="w-full h-12 text-lg gap-2"
              size="lg"
            >
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              You'll be able to create or join an organization after connecting
            </p>
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
            <CardDescription>
              {createdOrg.name} has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Share this invite code with your team</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-lg font-bold">{createdOrg.code}</code>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCopyCode(createdOrg.code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
<div className="text-sm text-muted-foreground">
              <p>As the organization owner, you can:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Invite employees with this code</li>
                <li>Manage payroll and bonuses</li>
                <li>View encrypted salary data</li>
              </ul>
            </div>
            
            <Button 
              onClick={() => navigate("/admin")} 
              className="w-full"
              size="lg"
            >
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
            {step === "select" 
              ? "Choose how you'd like to get started"
              : step === "create-org"
              ? "Set up your organization"
              : "Join your team"}
          </CardDescription>
        </CardHeader>
        
        {step === "select" && (
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setStep("create-org")}
              className="w-full h-auto py-6 flex flex-col items-start gap-2"
              variant="outline"
            >
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
            
            <Button 
              onClick={() => setStep("join-org")}
              className="w-full h-auto py-6 flex flex-col items-start gap-2"
              variant="outline"
            >
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
              <Input
                id="orgName"
                placeholder="Acme Corporation"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="orgDescription">Description (Optional)</Label>
              <Textarea
                id="orgDescription"
                placeholder="Brief description of your organization"
                value={orgDescription}
                onChange={(e) => setOrgDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                As the founder, you'll be the admin and can invite employees using an invite code.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep("select")}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleCreateOrg}
                disabled={!orgName || creating}
                className="flex-1"
              >
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
                  <Input
                    id="inviteCode"
                    placeholder="XXXX-XXXX-XXXX"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="text-center font-mono text-lg tracking-widest"
                  />
                </div>
                
                {joinError && (
                  <p className="text-sm text-destructive">{joinError}</p>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep("select")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleValidateInvite}
                    disabled={!inviteCode || joining}
                    className="flex-1"
                  >
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
                
                <p className="text-sm text-muted-foreground">
                  Once you join, you'll be able to view your encrypted salary and payment history.
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setValidatedOrg(null);
                      setInviteCode("");
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
<Button 
                    onClick={() => {
                      // Save pending status and redirect
                      localStorage.setItem("pending_org_id", validatedOrg.id);
                      navigate("/pending");
                    }}
                    className="flex-1"
                  >
                    Join Organization
                  </Button>
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