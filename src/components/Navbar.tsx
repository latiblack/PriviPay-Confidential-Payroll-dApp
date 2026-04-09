import { useState } from "react";
import { Shield, Wallet, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavbarProps {
  connected: boolean;
  onConnect: () => void;
  walletAddress?: string;
}

export const Navbar = ({ connected, onConnect, walletAddress }: NavbarProps) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Employer", path: "/employer" },
    { label: "Employee", path: "/employee" },
    { label: "Auditor", path: "/auditor" },
    { label: "Bonus Voting", path: "/voting" },
  ];

  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold text-foreground">PriviPay</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onConnect}
              variant={connected ? "outline" : "default"}
              size="sm"
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              {connected
                ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
                : "Connect Wallet"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 pb-3 pt-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};
