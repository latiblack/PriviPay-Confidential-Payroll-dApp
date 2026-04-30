import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ThumbsUp, Loader2, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
  const [voting, setVoting] = useState(false);

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
    if (!profile?.currentOrganization?.id || !canVote) return;

    setVoting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setVotedIds(prev => new Set(prev).add(employeeId));
      setVoteCounts(prev => ({
        ...prev,
        [employeeId]: (prev[employeeId] || 0) + 1
      }));

      toast({
        title: "Vote Submitted",
        description: `Vote recorded for employee`,
      });
    } catch (err) {
      console.error("Error voting:", err);
      toast({ title: "Error", description: "Failed to submit vote", variant: "destructive" });
    } finally {
      setVoting(false);
    }
  };

  if (!profile?.currentOrganization) {
    return <div className="p-6">No organization found</div>;
  }

  const maxVotes = Math.max(...Object.values(voteCounts), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonus Voting</h1>
        <p className="text-muted-foreground">
          {isEmployee 
            ? "Vote for employees to receive bonus rewards" 
            : "Allocate bonus rewards to employees"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes Cast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(voteCounts).reduce((a, b) => a + b, 0)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Voting Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={canVote ? "default" : "secondary"}>
              {canVote ? "Can Vote" : "View Only"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Bonuses
          </CardTitle>
          <CardDescription>
            {isOwner 
              ? "View vote counts and distribute bonuses" 
              : "Vote for employees to receive bonus rewards"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No employees found</p>
          ) : (
            <div className="space-y-4">
              {employees.map((emp) => {
                const votes = voteCounts[emp.id] || 0;
                const percentage = (votes / maxVotes) * 100;
                const hasVoted = votedIds.has(emp.id);
                
                return (
                  <div key={emp.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ThumbsUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {emp.position || "Employee"} - {emp.wallet_address?.slice(0, 8)}...{emp.wallet_address?.slice(-4)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(emp.salary || 0).toLocaleString()}/mo salary
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-48">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Votes: {votes}</span>
                          <span>{Math.round(percentage)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                      
                      {canVote && !isEmployee && (
                        <Button
                          variant={hasVoted ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handleVote(emp.id)}
                          disabled={voting || hasVoted}
                          className="gap-1"
                        >
                          {voting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : hasVoted ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <ThumbsUp className="h-3 w-3" />
                          )}
                          {hasVoted ? "Voted" : "Vote"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BonusVoting;