import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockBonusVotes, BonusVote } from "@/lib/mock-data";
import { Vote, Lock, CheckCircle, ThumbsUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BonusVoting = () => {
  const [votes, setVotes] = useState<BonusVote[]>(mockBonusVotes);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const handleVote = (id: string) => {
    setVotes((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, votes: v.votes + 1 } : v
      )
    );
    setVotedIds((prev) => new Set(prev).add(id));
    toast({
      title: "Vote encrypted & submitted",
      description: "Your vote has been encrypted using FHE and recorded on-chain.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Confidential Bonus Voting</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vote on employee bonuses — all votes encrypted via FHE
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Vote className="h-3 w-3" /> Manager Access
        </Badge>
      </div>

      <Card className="mb-8 bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">How it works</p>
              <p className="text-sm text-muted-foreground mt-1">
                Each vote is encrypted as an <code className="bg-secondary px-1 rounded">euint</code> before submission.
                No one sees who voted for whom. The final bonus amount is computed on encrypted votes
                using Fully Homomorphic Encryption — trust the result without seeing the inputs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {votes.map((vote) => (
          <Card key={vote.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{vote.employeeName}</CardTitle>
                  <CardDescription>Bonus allocation vote</CardDescription>
                </div>
                <Badge variant={vote.status === "completed" ? "default" : "secondary"}>
                  {vote.status === "completed" ? (
                    <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</span>
                  ) : (
                    "Active"
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Encrypted votes: {vote.votes}/{vote.totalVoters}</span>
                  <code className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                    {vote.encryptedResult}
                  </code>
                </div>
                <Progress value={(vote.votes / vote.totalVoters) * 100} />
                {vote.status === "active" && (
                  <Button
                    size="sm"
                    onClick={() => handleVote(vote.id)}
                    disabled={votedIds.has(vote.id)}
                    className="gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {votedIds.has(vote.id) ? "Vote Submitted (Encrypted)" : "Cast Encrypted Vote"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BonusVoting;
