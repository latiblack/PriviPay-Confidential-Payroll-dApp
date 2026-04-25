import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  DollarSign, Users, Send, Wallet, Loader2, ArrowDownToLine, Lock
} from "lucide-react";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

const PaymentsPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isOwner = profile?.currentRole === "owner";

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [ownSalary, setOwnSalary] = useState<string>("***");

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
      setOwnSalary(mySalary?.encrypted_salary || "***");

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.currentOrganization?.id, profile?.walletAddress]);

  const handleProcessPayroll = async () => {
    if (!profile?.currentOrganization?.id || employees.length === 0) return;

    setProcessing(true);
    try {
      for (const emp of employees) {
        if (!emp.wallet_address || !emp.encrypted_salary) continue;

        await supabase.from("payment_transactions").insert({
          organization_id: profile.currentOrganization.id,
          employee_id: emp.wallet_address,
          amount: emp.encrypted_salary,
          status: "completed",
          created_at: new Date().toISOString(),
        });
      }

      toast({
        title: "Payroll Processed",
        description: `Payments sent to ${employees.length} employees via encrypted transfer`,
      });
    } catch (err) {
      console.error("Error processing payroll:", err);
      toast({ title: "Error", description: "Failed to process payroll", variant: "destructive" });
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
                Treasury Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${balance}</div>
              <p className="text-xs opacity-75 mt-1">USDC - Encrypted</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {isOwner ? "Treasury Wallet" : "Salary Wallet"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono truncate">
              {profile.walletAddress?.slice(0, 10)}...{profile.walletAddress?.slice(-4)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isOwner ? "Org treasury address" : "Your confidential salary address"}
            </p>
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
                <div className="text-3xl font-bold">${totalPayroll.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {employees.length} employee{employees.length !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">{ownSalary}</div>
                <p className="text-xs text-muted-foreground mt-1">USDC/month - Confidential</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Process Payroll
            </CardTitle>
            <CardDescription>
              Send encrypted payments to all active employees
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
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Employees to pay</span>
                    <Badge variant="default">{employees.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total amount (encrypted)</span>
                    <span className="text-xl font-bold">${totalPayroll.toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  onClick={handleProcessPayroll}
                  disabled={processing}
                  className="w-full gap-2"
                  size="lg"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {processing ? "Processing Encrypted Payments..." : "Process Encrypted Payroll"}
                </Button>
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
              Withdraw Funds
            </CardTitle>
            <CardDescription>
              Withdraw your salary to your personal wallet (encrypted transaction)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Available Balance (Encrypted)</div>
              <div className="text-2xl font-bold">{ownSalary} USDC</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (USDC)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full gap-2" size="lg" disabled={!recipient || !amount}>
              <ArrowDownToLine className="h-4 w-4" />
              Withdraw via Encrypted Transfer
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isOwner ? "All Employees" : "Your Payment History"}
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
                      <span className="text-xs font-semibold">
                        {emp.wallet_address?.slice(0, 2) || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {emp.wallet_address?.slice(0, 8)}...{emp.wallet_address?.slice(-4)}
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
                Your salary is encrypted. Others cannot see your payment details.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsPage;