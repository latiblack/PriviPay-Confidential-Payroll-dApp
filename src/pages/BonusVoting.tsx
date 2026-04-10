import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockBonusVotes, BonusVote } from "@/lib/mock-data";
import { Lock, CheckCircle, ThumbsUp, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BonusVoting = () => {
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
              <p className="text-sm font-semibold text-foreground">How Confidential Voting Works</p>
              <p className="text-sm text-muted-foreground mt-1">
                Each vote is encrypted as an <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">euint</code> before submission.
                The final bonus is computed on encrypted votes using FHE — trust the result without seeing inputs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vote Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {votes.map((vote) => (
          <Card key={vote.id} className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">{vote.employeeName}</CardTitle>
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
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Votes: {vote.votes}/{vote.totalVoters}</span>
                  <span>{Math.round((vote.votes / vote.totalVoters) * 100)}%</span>
                </div>
                <Progress value={(vote.votes / vote.totalVoters) * 100} className="h-2" />
              </div>
              <code className="block text-[11px] bg-secondary px-3 py-2 rounded-lg text-muted-foreground truncate">
                {vote.encryptedResult}
              </code>
              {vote.status === "active" && (
                <Button
                  size="sm"
                  onClick={() => handleVote(vote.id)}
                  disabled={votedIds.has(vote.id)}
                  className="w-full gap-2 rounded-xl"
                >
                  <ThumbsUp className="h-4 w-4" />
                  {votedIds.has(vote.id) ? "Submitted" : "Cast Vote"}
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
