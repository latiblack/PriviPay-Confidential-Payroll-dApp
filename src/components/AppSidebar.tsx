import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Shield, LayoutGrid, FileText, BarChart3, Vote, Bell, Settings, LogOut, Users, DollarSign, Gift, MailPlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import { authService } from "@/lib/auth-service";

export const AppSidebar = () => {
  const location = useLocation();
  const { isAuthenticated, disconnectWallet } = useWalletAuth();
  const { profile } = useAuth();

  // Owner sees everything - Admin, Employees, Payments, Bonus, Notifications
  const ownerNavItems = [
    { icon: LayoutGrid, label: "Admin", path: "/admin" },
    { icon: Users, label: "Employees", path: "/employees" },
    { icon: DollarSign, label: "Treasury", path: "/payments" },
    { icon: Gift, label: "Bonus", path: "/bonus" },
    { icon: MailPlus, label: "Invitations", path: "/invitations" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  // Employees see only their own dashboard, payments (withdraw), bonus, auditor, notifications
  // They CANNOT see: Admin, Employees list (others' details), Treasury
  const employeeNavItems = [
    { icon: LayoutGrid, label: "My Dashboard", path: "/employee" },
    { icon: DollarSign, label: "Payments", path: "/payments" },
    { icon: Gift, label: "Bonus", path: "/bonus" },
    { icon: BarChart3, label: "Audit", path: "/auditor" },
    { icon: MailPlus, label: "Invitations", path: "/invitations" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  // Managers see dashboard, payments, bonus, auditor, notifications
  // They CANNOT see: Admin, Employees list (others' details), Treasury
  const managerNavItems = [
    { icon: LayoutGrid, label: "Dashboard", path: "/employee" },
    { icon: DollarSign, label: "Payments", path: "/payments" },
    { icon: Gift, label: "Bonus", path: "/bonus" },
    { icon: BarChart3, label: "Audit", path: "/auditor" },
    { icon: MailPlus, label: "Invitations", path: "/invitations" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  // Auditors see dashboard, payments, bonus, audit, notifications
  const auditorNavItems = [
    { icon: LayoutGrid, label: "Dashboard", path: "/employee" },
    { icon: DollarSign, label: "Payments", path: "/payments" },
    { icon: Gift, label: "Bonus", path: "/bonus" },
    { icon: BarChart3, label: "Audit", path: "/auditor" },
    { icon: MailPlus, label: "Invitations", path: "/invitations" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  // Select nav based on role
  let navItems = employeeNavItems;
  if (profile?.currentRole === "owner") {
    navItems = ownerNavItems;
  } else if (profile?.currentRole === "manager") {
    navItems = managerNavItems;
  } else if (profile?.currentRole === "auditor") {
    navItems = auditorNavItems;
  }

  const handleLogout = () => {
    authService.clearProfile();
    disconnectWallet();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col items-center border-r border-sidebar-border bg-sidebar py-6">
      {/* Logo */}
      <Link to="/" className="mb-8">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-1">
          <Logo size={28} alt="PriviPay" className="shrink-0" />
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to="/settings"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Settings
          </TooltipContent>
        </Tooltip>
        {isAuthenticated && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Disconnect
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
};
