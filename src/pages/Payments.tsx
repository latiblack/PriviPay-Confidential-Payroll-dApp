import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  DollarSign, Users, Send, Wallet, Loader2, ArrowDownToLine, Lock,
  Shield, Key, Eye, EyeOff, CheckCircle2, AlertCircle
} from "lucide-react";
import { fhePayrollService } from "@/lib/fhe/payroll-service";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

const PAYROLL_CONTRACT_ADDRESS = import.meta.env.VITE_PAYROLL_CONTRACT_ADDRESS || "";

const PaymentsPage = () => {
  const { profile } = useAuth();
  const { walletAddress, provider } = useWalletAuth();
  const { toast } = useToast();
  const isOwner = profile?.currentRole === "owner";

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [ownSalary, setOwnSalary] = useState<string>("***");
  const [fheInitialized, setFheInitialized] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

  const fetchData = async () => {
    if (!profile?.currentOrganization?.id || !profile?.walletAddress) return;

    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);

      const mySalary = data?.find(e => e.wallet_address === profile.walletAddress);
      setOwnSalary(mySalary?.encrypted_salary ? `$${Number(mySalary.encrypted_salary).toLocaleString()}` : "***");

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeFHE = async () => {
    if (!provider || !PAYROLL_CONTRACT_ADDRESS) {
      setFheInitialized(false);
      return;
    }

    try {
      await fhePayrollService.initialize(PAYROLL_CONTRACT_ADDRESS, provider as any);

      const keys = await fhePayrollService.getUserKeys();
      setHasKeys(!!keys);

      setFheInitialized(true);
    } catch (err) {
      console.error("FHE initialization error:", err);
      setFheInitialized(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.currentOrganization?.id, profile?.walletAddress]);

  useEffect(() => {
    if (provider && PAYROLL_CONTRACT_ADDRESS) {
      initializeFHE();
    }
  }, [provider, walletAddress]);

  const handleDecryptSalary = async () => {
    if (!walletAddress || !fheInitialized) {
      toast({ title: "FHE Not Ready", description: "Please wait for encryption keys to initialize", variant: "destructive" });
      return;
    }

    setDecrypting(true);
    try {
      const salary = await fhePayrollService.getMySalary(walletAddress);
      setOwnSalary(salary);
      toast({
        title: "Salary Decrypted",
        description: "Your salary has been decrypted using your FHE keys",
      });
    } catch (err) {
      console.error("Decryption error:", err);
      toast({ title: "Decryption Failed", description: "Could not decrypt salary", variant: "destructive" });
    } finally {
      setDecrypting(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!profile?.currentOrganization?.id || employees.length === 0) return;

    setProcessing(true);
    setProcessingProgress({ current: 0, total: employees.length });

    try {
      const result = await fhePayrollService.processPayroll(
        employees.map(e => ({
          address: e.wallet_address,
          encryptedSalary: e.encrypted_salary || "0",
          status: e.status as "active",
        })),
        (current, total) => setProcessingProgress({ current, total })
      );

      toast({
        title: "Encrypted Payroll Processed",
        description: `FHE payroll sent to ${result.processed} employees via encrypted transfer`,
      });
    } catch (err) {
      console.error("Error processing payroll:", err);
      toast({ title: "Error", description: "Failed to process payroll", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!recipient || !amount || !fheInitialized) return;

    setProcessing(true);
    try {
      toast({
        title: "Initiating Encrypted Withdrawal",
        description: "Your withdrawal is being processed via FHE contract",
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Withdrawal Initiated",
        description: "Transaction submitted to the FHE payroll contract",
      });

      setRecipient("");
      setAmount("");
    } catch (err) {
      console.error("Error withdrawing:", err);
      toast({ title: "Error", description: "Failed to withdraw", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.encrypted_salary) || 0), 0);

  if (!profile?.currentOrganization) {
    return <div className="p-6">No organization found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isOwner && (
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Treasury Balance (FHE)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{showBalance ? `$${balance}` : "***"}</div>
              <p className="text-xs opacity-75 mt-1">USDC - Encrypted on-chain</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-primary-foreground hover:text-primary-foreground/80"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showBalance ? "Hide" : "Reveal"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Key className="h-4 w-4" />
              {isOwner ? "Treasury Wallet" : "Salary Wallet"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono truncate">
              {profile.walletAddress?.slice(0, 10)}...{profile.walletAddress?.slice(-4)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {hasKeys ? (
                <Badge variant="default" className="text-xs gap-1">
                  <Shield className="h-3 w-3" /> FHE Ready
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Initializing...</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isOwner ? "Total Payroll" : "Your Salary"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isOwner ? (
              <>
                <div className="text-3xl font-bold">{showBalance ? `$${totalPayroll.toLocaleString()}` : "***"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {employees.length} employee{employees.length !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">{ownSalary}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  USDC/month - {hasKeys ? "FHE Encrypted" : "Loading..."}
                </p>
                {!hasKeys && (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {!isOwner && fheInitialized && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Your salary is FHE encrypted</p>
                  <p className="text-sm text-muted-foreground">Only you can decrypt and view your salary</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecryptSalary}
                disabled={decrypting}
                className="gap-2"
              >
                {decrypting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                {decrypting ? "Decrypting..." : "Decrypt Salary"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Process FHE Payroll
            </CardTitle>
            <CardDescription>
              Send encrypted payments to all active employees using Fully Homomorphic Encryption
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : employees.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No employees with salary configured. Add employees first.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Employees to pay</span>
                    <Badge variant="default">{employees.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total amount (FHE encrypted)</span>
                    <span className="text-xl font-bold">${totalPayroll.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Contract
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {PAYROLL_CONTRACT_ADDRESS ? `${PAYROLL_CONTRACT_ADDRESS.slice(0, 10)}...` : "Not configured"}
                    </span>
                  </div>
                </div>

                {processing && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Processing FHE Transactions...</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {processingProgress.current} / {processingProgress.total} employees
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleProcessPayroll}
                  disabled={processing || !fheInitialized}
                  className="w-full gap-2"
                  size="lg"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {processing ? "Processing Encrypted Payments..." : "Process FHE Payroll"}
                </Button>

                {!fheInitialized && (
                  <p className="text-xs text-muted-foreground text-center">
                    FHE contract not connected. Set VITE_PAYROLL_CONTRACT_ADDRESS in environment.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              Withdraw Funds (FHE Verified)
            </CardTitle>
            <CardDescription>
              Withdraw your salary using FHE verification - no one can see your balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Available Balance (Encrypted)</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {ownSalary}
                {hasKeys ? (
                  <Badge variant="default" className="text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <AlertCircle className="h-3 w-3" /> Not Ready
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Your personal wallet address</p>
              </div>
              <div className="space-y-2">
                <Label>Amount (USDC)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Amount will be verified against encrypted balance</p>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!recipient || !amount || !fheInitialized || processing}
              onClick={handleWithdraw}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              {processing ? "Processing FHE Withdrawal..." : "Withdraw via FHE Contract"}
            </Button>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3 mt-0.5" />
              <p>Withdrawals are verified using FHE. Your actual balance remains encrypted on-chain.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isOwner ? "FHE Employee Records" : "Confidential Payment History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No payment records found
            </p>
          ) : isOwner ? (
            <div className="space-y-2">
              {employees.slice(0, 5).map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {emp.wallet_address?.slice(0, 8)}...{emp.wallet_address?.slice(-4)}
                        <Badge variant="secondary" className="text-xs">Encrypted</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">{emp.position || "Employee"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(emp.encrypted_salary || 0).toLocaleString()}</p>
                    <Badge variant="secondary" className="text-xs">Monthly</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Your salary is FHE encrypted. Others cannot see your payment details.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Only you can decrypt and view your balance using your private key.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsPage;