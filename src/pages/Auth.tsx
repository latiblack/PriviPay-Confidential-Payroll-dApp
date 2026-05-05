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
import { useWalletClient, useAccount, useSwitchChain } from "wagmi";
import { supabase } from "@/integrations/supabase/client";
import { deployPayrollContract } from "@/lib/deploy-payroll-contract";

type AuthStep = "select" | "create-org" | "join-org" | "success";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, walletAddress, connectWallet, user } = useWalletAuth();
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<AuthStep>("select");
  const [loading, setLoading] = useState(true);
  const { data: walletClient } = useWalletClient();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [deployStatus, setDeployStatus] = useState<string>("");

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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background/50 to-primary/5">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/15 rounded-full blur-3xl" />
        </div>
        
        <div className="relative min-h-screen flex items-center justify-center">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                <img 
                  src="/logo.png" 
                  alt="PriviPay" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">PriviPay</h2>
              <p className="text-muted-foreground text-sm sm:text-base px-2">Setting up your secure environment</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

// User is authenticated but waiting for embedded wallet to be created
  if (isAuthenticated && user && !walletAddress) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background/50 to-primary/5">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/15 rounded-full blur-3xl" />
        </div>
        
        <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-sm sm:max-w-md bg-card/80 backdrop-blur-xl border-border shadow-xl shadow-primary/5 mx-2">
            <CardHeader className="text-center px-3 sm:px-4">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 mb-3 sm:mb-4">
                <img 
                  src="/logo.png" 
                  alt="PriviPay" 
                  className="w-full h-full object-contain"
                />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Creating Your Wallet</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">Setting up your secure wallet for confidential payroll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-4">
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we create your secure wallet.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleCreateOrg = async () => {
    if (!walletAddress || !orgName) return;
    if (!walletClient) {
      setDeployStatus("Wallet not ready. Please reconnect and try again.");
      return;
    }
    setCreating(true);
    setDeployStatus("");
    try {
      // 1. Ensure we're on Sepolia BEFORE doing anything
      if (chainId !== 11155111) {
        setDeployStatus("Switching to Sepolia network...");
        try {
          await switchChain({ chainId: 11155111 });
        } catch (e) {
          throw new Error("Please switch your wallet to the Sepolia network and try again.");
        }
        // Give wallet a moment to update walletClient with new chain
        await new Promise((r) => setTimeout(r, 800));
      }

      // 2. Pre-check the wallet has some Sepolia ETH for gas
      setDeployStatus("Checking wallet balance for gas...");
      try {
        const { createPublicClient, http, formatEther } = await import("viem");
        const { sepolia } = await import("viem/chains");
        const pub = createPublicClient({
          chain: sepolia,
          transport: http(import.meta.env.VITE_SEPOLIA_RPC || "https://rpc.sepolia.org"),
        });
        const bal = await pub.getBalance({ address: walletAddress as `0x${string}` });
        // ~0.002 ETH safety floor for contract deployment gas
        if (bal < 2_000_000_000_000_000n) {
          throw new Error(
            `Insufficient Sepolia ETH for gas (have ${formatEther(bal)} ETH). ` +
              `Get free testnet ETH from a Sepolia faucet (e.g. sepoliafaucet.com), then try again.`,
          );
        }
      } catch (balErr: any) {
        if (balErr?.message?.includes("Insufficient")) throw balErr;
        // If balance check itself fails, log and continue — wallet will surface the real error.
        console.warn("Balance precheck failed, continuing:", balErr);
      }

      // 3. Generate a temp org id for the on-chain bytes32 (deploy FIRST, persist nothing yet)
      setDeployStatus("Deploying your payroll contract on Sepolia. Please confirm in your wallet...");
      console.log("Starting contract deployment...");
      const tempOrgId = crypto.randomUUID();
      let deployed: { address: string; txHash: string };
      try {
        deployed = await deployPayrollContract(walletClient, tempOrgId);
        console.log("Contract deployed successfully:", deployed);
      } catch (deployErr: any) {
        console.error("Contract deployment failed:", deployErr);
        const msg = (deployErr?.shortMessage || deployErr?.message || "").toLowerCase();
        if (msg.includes("user rejected") || msg.includes("user denied")) {
          throw new Error("You declined the transaction in your wallet. The organization was not created.");
        }
        if (msg.includes("insufficient funds")) {
          throw new Error("Insufficient Sepolia ETH for gas. Top up your wallet and try again.");
        }
        throw new Error("Contract deployment failed. The organization was not created. " + (deployErr?.shortMessage || deployErr?.message || ""));
      }

      // 4. Only NOW create the org row in the database
      setDeployStatus("Saving organization...");
      console.log("Creating organization in database...");
      const org = await organizationService.createOrganization({
        name: orgName,
        description: orgDescription,
        ownerWalletAddress: walletAddress,
        ownerId: walletAddress,
      });
      console.log("Organization created:", org);

      // 5. Persist contract info
      console.log("Saving contract info...");
      try {
        await organizationService.updateContractInfo(org.id, deployed.address, deployed.txHash);
        console.log("Contract info saved");
      } catch (e) {
        console.error("Failed to save contract info:", e);
      }

      setDeployStatus("Generating invite code...");
      console.log("Creating invitation...");
      const invitation = await organizationService.createInvitation({
        organizationId: org.id,
        role: "employer",
        createdBy: walletAddress,
      });
      console.log("Invitation created:", invitation);

      console.log("Setting success state...");
      setCreatedOrg({ name: org.name, code: invitation.code });
      await refreshProfile();
      setStep("success");
      console.log("Done! Moving to success page");
    } catch (error) {
      console.error("Error creating organization:", error);
      setDeployStatus((error as Error)?.message || "Something went wrong");
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background/50 to-primary/5">
      {/* Light decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/15 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6">
              <img 
                src="/logo.png" 
                alt="PriviPay" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2 tracking-tight">PriviPay</h1>
            <p className="text-muted-foreground text-sm sm:text-lg px-2">Confidential Payroll Management</p>
          </div>

          {/* Main Card */}
          <Card className="bg-card/80 backdrop-blur-xl border-border shadow-xl shadow-primary/5 mx-2 sm:mx-0">
            <CardHeader className="text-center pb-2 px-3 sm:px-4">
              <CardTitle className="text-xl sm:text-2xl font-semibold">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">Connect your wallet to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pt-3 sm:pt-4 px-3 sm:px-4">
              {/* Feature Highlights - responsive grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-foreground leading-tight">FHE Encrypted</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-foreground leading-tight">Secure Access</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-foreground leading-tight">Verified Audit</p>
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-blue-100" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-blue-400">Secure Wallet Connection</span>
                </div>
              </div>

              {/* Connect Wallet Button */}
              <div className="flex justify-center">
                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;
                    
                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          'style': { opacity: 0.8, pointerEvents: 'none', userSelect: 'none' },
                        })}
                        className="w-full"
                      >
                        {!connected ? (
                          <button
                            onClick={openConnectModal}
                            className="w-full group"
                          >
                            <div className="w-full h-12 sm:h-14 bg-primary rounded-xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 px-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                              </div>
                              <span className="text-primary-foreground font-semibold text-base sm:text-lg">Connect Wallet</span>
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground/70 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </button>
                        ) : (
                          <button
                            onClick={openAccountModal}
                            className="w-full rounded-xl border border-border hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs sm:text-sm font-bold">
                                  {account.displayName?.[0] || account.displayName?.slice(0, 2) || '?'}
                                </div>
                                <div className="text-left">
                                  <p className="text-foreground font-medium text-sm sm:text-base">{account.displayName}</p>
                                  <p className="text-muted-foreground text-xs">{account.displayBalance?.[0] || '0.00'} ETH</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {chain?.iconUrl && (
                                  <img src={chain.iconUrl} alt={chain.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                                )}
                                <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              <p className="text-center text-[10px] sm:text-xs text-muted-foreground px-2">
                By connecting, you agree to our Terms of Service
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-muted-foreground/60 text-xs sm:text-sm mt-6 sm:mt-8 px-2">
            Powered by Fully Homomorphic Encryption
          </p>
        </div>
      </div>
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
            {deployStatus && (
              <p className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2">
                {creating && <Loader2 className="inline h-3 w-3 mr-1.5 animate-spin" />}
                {deployStatus}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              We'll deploy a dedicated confidential payroll contract from your wallet on Sepolia.
              You'll need to approve one transaction.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select")} className="flex-1" disabled={creating}>Back</Button>
              <Button onClick={handleCreateOrg} disabled={!orgName || creating || !walletClient} className="flex-1">
                {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Working...</> : "Create Organization"}
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
                        } catch (e: any) {
                          console.error("Accept error:", e);
                          setJoinError(e?.message || "Failed to accept invitation");
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
                  } catch (e: any) {
                    console.error("Join error:", e);
                    setJoinError(e?.message || "Failed to join organization");
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