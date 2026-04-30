import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PendingRole = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your request to join the organization has been submitted. 
            Please wait for the organization admin to approve your access.
          </p>
          
          <div className="bg-muted rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">What happens next?</p>
            <ul className="text-muted-foreground text-left space-y-1">
              <li>• The organization admin will review your request</li>
              <li>• Once approved, you'll get access to your data</li>
              <li>• You'll see your salary and payment history</li>
            </ul>
          </div>

          <Button onClick={() => navigate("/notifications")} className="w-full gap-2">
            View Notifications <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingRole;