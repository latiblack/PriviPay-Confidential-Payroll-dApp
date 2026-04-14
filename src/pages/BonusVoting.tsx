import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockBonusVotes, BonusVote } from "@/lib/mock-data";
import { Lock, CheckCircle, ThumbsUp, ArrowRight, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const BonusVoting = () => {
  const { profile } = useAuth();
  const isEmployee = profile?.currentRole === "employee";
  const canVote = profile?.currentRole === "owner" || profile?.currentRole === "manager";
  
  const [votes, setVotes] = useState<BonusVote[]>(mockBonusVotes);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const handleVote = (id: string) => {
    setVotes((prev) => prev.map((v) => (v.id === id ? { ...v, votes: v.votes + 1 } : v)));
    setVotedIds((prev) => new Set(prev).add(id));
    toast({
      title: "Vote encrypted & submitted",
      description: "Your vote has been encrypted using FHE and recorded on-chain.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isEmployee 
                  ? "View Bonus Distribution - Confidential"
                  : canVote
                  ? "How Confidential Voting Works"
                  : "View Bonus Distribution - Confidential"
                }
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isEmployee 
                  ? "You can see that bonus votes are being processed without viewing individual amounts or recipient details."
                  : canVote
                  ? "Each vote is encrypted as an euint before submission. The final bonus is computed on encrypted votes using FHE."
                  : "You can see that bonus votes are being processed without viewing individual amounts."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee sees blurred view */}
      {isEmployee && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <EyeOff className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Confidential View</p>
              <p className="text-sm text-amber-600">Details are hidden. You can verify votes are happening.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vote Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {votes.map((vote) => (
          <Card key={vote.id} className={`border shadow-sm ${isEmployee ? "blur-sm" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  {isEmployee ? "Employee A" : canVote ? vote.employeeName : "Employee A"}
                </CardTitle>
                <Badge
                  variant={vote.status === "completed" ? "default" : "secondary"}
                  className={vote.status === "completed" ? "bg-accent/10 text-accent border-0 text-xs" : "text-xs"}
                >
                  {vote.status === "completed" ? (
                    <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Done</span>
                  ) : "Active"}
                </Badge>
              </div>
              <CardDescription className="text-xs">Bonus allocation vote</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Votes</span>
                  <span className="font-medium">{isEmployee ? "***" : `${vote.votes}/${vote.totalVoters}`}</span>
                </div>
                <Progress value={vote.votes / vote.totalVoters * 100} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                {isEmployee 
                  ? "Status: ***"
                  : `Status: ${vote.status}`
                }
              </div>
              {canVote && vote.status !== "completed" && (
                <Button 
                  onClick={() => handleVote(vote.id)} 
                  disabled={votedIds.has(vote.id)}
                  className="w-full gap-2" 
                  size="sm"
                >
                  <ThumbsUp className="h-4 w-4" />
                  {votedIds.has(vote.id) ? "Voted" : "Vote"}
                </Button>
              )}
              {(!canVote || vote.status === "completed") && (
                <Button variant="outline" className="w-full" size="sm" disabled>
                  {vote.status === "completed" ? "Completed" : "View Only"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BonusVoting;