import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DollarSign, Users, Loader2, Plus, Gift, Calendar, Trash2 } from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

interface Bonus {
  id: string;
  employee_id: string;
  amount: number;
  month: string;
  created_at: string;
}

const BonusPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const canAddBonus = profile?.currentRole === "owner" || profile?.currentRole === "manager" || profile?.currentRole === "employee";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusMonth, setBonusMonth] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.currentOrganization?.id) return;

      try {
        // Get employees in payroll (salary > 0)
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .eq("status", "active");

        if (empError) throw empError;
        
        const activeEmployees = (empData || []).filter(e => Number(e.encrypted_salary) > 0);
        setEmployees(activeEmployees);

        // Get all bonuses
        const { data: bonusData, error: bonusError } = await supabase
          .from("bonuses")
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .order("created_at", { ascending: false });

        if (bonusError) throw bonusError;
        setBonuses(bonusData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.currentOrganization?.id]);

  const getEmployeeName = (emp: Employee) => {
    return (emp as any).name || emp.wallet_address?.slice(0, 8) + "..." + emp.wallet_address?.slice(-4);
  };

  const getEmployeeBonus = (employeeId: string) => {
    return bonuses
      .filter(b => b.employee_id === employeeId)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const handleAddBonus = async () => {
    if (!profile?.currentOrganization?.id || !selectedEmployeeId || !bonusAmount || !bonusMonth) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bonuses")
        .insert({
          organization_id: profile.currentOrganization.id,
          employee_id: selectedEmployeeId,
          amount: Number(bonusAmount),
          month: bonusMonth,
        });

      if (error) throw error;

      toast({ title: "Bonus Added", description: `Bonus of $${Number(bonusAmount).toLocaleString()} added for ${bonusMonth}` });
      
      // Refresh bonuses
      const { data } = await supabase
        .from("bonuses")
        .select("*")
        .eq("organization_id", profile.currentOrganization.id)
        .order("created_at", { ascending: false });
      setBonuses(data || []);

      setShowAddDialog(false);
      setSelectedEmployeeId("");
      setBonusAmount("");
      setBonusMonth("");
    } catch (err) {
      console.error("Error adding bonus:", err);
      toast({ title: "Error", description: "Failed to add bonus", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBonus = async (bonusId: string) => {
    if (!confirm("Delete this bonus?")) return;

    try {
      const { error } = await supabase
        .from("bonuses")
        .delete()
        .eq("id", bonusId);

      if (error) throw error;

      setBonuses(prev => prev.filter(b => b.id !== bonusId));
      toast({ title: "Bonus Deleted", description: "Bonus has been removed" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete bonus", variant: "destructive" });
    }
  };

  // Get current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);

  if (!profile?.currentOrganization) {
    return <div className="p-6">No organization found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bonus Management</h1>
          <p className="text-muted-foreground text-lg mt-1">Add monthly bonuses for employees</p>
        </div>
        {canAddBonus && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 text-lg px-6 py-4">
                <Plus className="h-5 w-5" />
                Add Bonus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Monthly Bonus</DialogTitle>
                <DialogDescription>Add bonus for an employee for a specific month</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <select
                    className="w-full p-3 border rounded-lg bg-background"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {getEmployeeName(emp)} - ${Number(emp.encrypted_salary || 0).toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Input
                    type="month"
                    value={bonusMonth || currentMonth}
                    onChange={(e) => setBonusMonth(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Amount (USD)</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button 
                  onClick={handleAddBonus} 
                  disabled={saving || !selectedEmployeeId || !bonusAmount || !bonusMonth}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Bonus"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalBonuses.toLocaleString()}</div>
            <p className="text-xs opacity-75 mt-1">all time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Bonuses This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${bonuses.filter(b => b.month === currentMonth).reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs opacity-75 mt-1">{currentMonth}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees with Bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(bonuses.map(b => b.employee_id)).size}
            </div>
            <p className="text-xs opacity-75 mt-1">unique employees</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Employee Bonuses
          </CardTitle>
          <CardDescription>View and manage employee bonuses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-lg">No employees in payroll yet.</p>
          ) : (
            <div className="space-y-4">
              {employees.map((emp) => {
                const empBonus = getEmployeeBonus(emp.id);
                const empBonuses = bonuses.filter(b => b.employee_id === emp.id);
                
                return (
                  <div key={emp.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Gift className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{getEmployeeName(emp)}</p>
                          <p className="text-sm text-muted-foreground">
                            {emp.position || "Employee"} • ${Number(emp.encrypted_salary || 0).toLocaleString()}/mo
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">${empBonus.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">total bonus</p>
                      </div>
                    </div>
                    
                    {empBonuses.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Bonus History:</p>
                        <div className="flex flex-wrap gap-2">
                          {empBonuses.map((bonus) => (
                            <Badge key={bonus.id} variant="outline" className="flex items-center gap-2 px-3 py-1">
                              <Calendar className="h-3 w-3" />
                              {bonus.month}: ${bonus.amount.toLocaleString()}
                              {canAddBonus && (
                                <button 
                                  onClick={() => handleDeleteBonus(bonus.id)}
                                  className="ml-1 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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

export default BonusPage;