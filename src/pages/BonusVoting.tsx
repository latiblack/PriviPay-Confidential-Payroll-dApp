import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, CheckCircle, ThumbsUp, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import organizationService from "@/lib/organization-service";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

const BonusVoting = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isEmployee = profile?.currentRole === "employee";
  const isOwner = profile?.currentRole === "owner";
  const canVote = profile?.currentRole === "owner" || profile?.currentRole === "manager";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!profile?.currentOrganization?.id) return;

      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id);

        if (error) throw error;
        setEmployees(data || []);

        if (isOwner) {
          const { data: votes } = await supabase
            .from("vote_records" as any)
            .select("employee_id")
            .eq("organization_id", profile.currentOrganization.id)
            .eq("status", "active");

          const counts: Record<string, number> = {};
          votes?.forEach((v: any) => {
            counts[v.employee_id] = (counts[v.employee_id] || 0) + 1;
          });
          setVoteCounts(counts);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [profile?.currentOrganization?.id, isOwner]);

  const handleVote = async (employeeId: string) => {
    if (!profile?.currentOrganization?.id || !profile.walletAddress) return;

    try {
      const { error } = await supabase
        .from("vote_records" as any)
        .insert({
          organization_id: profile.currentOrganization.id,
          employee_id: employeeId,
          voter_id: profile.walletAddress,
          vote_type: "bonus",
          status: "active",
        });

      if (error) throw error;

      await organizationService.notifyNewVote(profile.currentOrganization.id, votedIds.size + 1);
      setVotedIds((prev) => new Set(prev).add(employeeId));
      toast({
        title: "Vote encrypted & submitted",
        description: "Your vote has been encrypted using FHE and recorded on-chain.",
      });
    } catch (err) {
      console.error("Error voting:", err);
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isEmployee
                  ? "Bonus Voting - Confidential"
                  : canVote
                  ? "Bonus Voting - FHE Encrypted"
                  : "Bonus Voting - Confidential"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isEmployee
                  ? "Your vote is encrypted. You cannot see other employees' details."
                  : canVote
                  ? "Vote for employees to receive bonus. Votes are encrypted as euint before submission. Only the owner can decrypt final results."
                  : "Vote details are encrypted using FHE."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEmployee && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <EyeOff className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Confidential Voting</p>
              <p className="text-sm text-amber-600">You can vote without seeing other employees' personal information.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No employees found. Add employees first.
          </div>
        ) : (
          employees.map((emp) => (
            <Card key={emp.id} className={`border shadow-sm ${isEmployee ? "blur-sm pointer-events-none" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">
                    {isOwner 
                      ? emp.wallet_address.slice(0, 8) + "..." + emp.wallet_address.slice(-4)
                      : isEmployee 
                      ? "Confidential Employee" 
                      : emp.wallet_address.slice(0, 8) + "..." + emp.wallet_address.slice(-4)}
                  </CardTitle>
                  <Badge
                    variant={emp.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {emp.status === "active" ? (
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Active</span>
                    ) : emp.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {isEmployee ? "***" : emp.position || "Employee"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Salary</span>
                    <span className="font-medium">{isEmployee ? "***" : `$${emp.encrypted_salary || 0}/mo`}</span>
                  </div>
                  {isOwner && voteCounts[emp.id] !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Votes (Owner only)</span>
                      <span className="font-medium text-primary">{voteCounts[emp.id]} votes</span>
                    </div>
                  )}
                  <Progress value={emp.status === "active" ? 100 : 50} className="h-2" />
                </div>
                {canVote && !isEmployee && (
                  <Button
                    onClick={() => handleVote(emp.id)}
                    disabled={votedIds.has(emp.id)}
                    className="w-full gap-2"
                    size="sm"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {votedIds.has(emp.id) ? "Voted (Encrypted)" : "Vote for Bonus"}
                  </Button>
                )}
                {!canVote && (
                  <Button variant="outline" className="w-full" size="sm" disabled>
                    View Only
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BonusVoting;