import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import { DollarSign, Gift, LayoutGrid, BookOpen, LogOut, Wallet } from "lucide-react";

export const AppSidebar = () => {
  const location = useLocation();
  const { disconnectWallet } = useWalletAuth();
  const { state, clearContract } = useAuth();

  const ownerItems = [
    { icon: LayoutGrid, label: "Treasury", path: "/payments" },
    { icon: Gift, label: "Bonuses", path: "/bonus" },
    { icon: LayoutGrid, label: "Dashboard", path: "/employee" },
  ];

  const employeeItems = [
    { icon: LayoutGrid, label: "Dashboard", path: "/employee" },
    { icon: DollarSign, label: "Withdraw", path: "/payments" },
    { icon: Gift, label: "My Bonus", path: "/bonus" },
  ];

  const navItems = state.isOwner ? ownerItems : employeeItems;

  const handleLogout = () => {
    clearContract();
    disconnectWallet();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col items-center border-r border-sidebar-border bg-sidebar py-6">
      <Link to="/" className="mb-8">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-1">
          <Logo size={28} alt="PriviPay" className="shrink-0" />
        </div>
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to={item.path} className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                  <item.icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link to="/docs" className="flex h-11 w-11 items-center justify-center rounded-xl text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <BookOpen className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Documentation</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button onClick={handleLogout} className="flex h-11 w-11 items-center justify-center rounded-xl text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Disconnect</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
};
