import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DollarSign, Wallet, History, Loader2, Eye, EyeOff } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

interface PaymentData {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

const EmployeeDashboard = () => {
  const { profile } = useAuth();
  const { walletAddress } = useWalletAuth();
  const { toast } = useToast();
  const isEmployee = profile?.currentRole === "employee";
  const isOwnerView = profile?.currentRole === "owner";
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAmount, setShowAmount] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.currentOrganization?.id || !walletAddress) return;

      try {
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .eq("wallet_address", walletAddress)
          .single();

        if (empError) throw empError;
        setEmployee(empData);

        const { data: payData, error: payError } = await supabase
          .from("payments")
          .select("*")
          .eq("employee_id", empData.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!payError && payData) {
          setPayments(payData.map(p => ({
            id: p.id,
            amount: Number(p.amount),
            type: p.payment_type || "salary",
            status: p.status || "pending",
            created_at: p.created_at
          })));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.currentOrganization?.id, walletAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return <div className="p-6">No employee record found</div>;
  }

  const formatCurrency = (amount: number) => {
    return showAmount ? `$${amount.toLocaleString()}` : "***";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">View your salary and payment history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monthly Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              {formatCurrency(Number(employee.encrypted_salary) || 0)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAmount(!showAmount)}
                className="ml-2"
              >
                {showAmount ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.position || "Employee"}</div>
            <p className="text-sm text-muted-foreground mt-1">{employee.department || "General"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={employee.status === "active" ? "default" : "secondary"}>
              {employee.status}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-4)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No payment history</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{payment.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                    <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                      {payment.status}
                    </Badge>
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

export default EmployeeDashboard;