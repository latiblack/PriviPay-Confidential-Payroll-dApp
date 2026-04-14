import { Search, Bell, MessageSquare, Wallet, Sun, Moon, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/auth-service";

interface TopBarProps {
  title: string;
}

export const TopBar = ({ title }: TopBarProps) => {
  const [dark, setDark] = useState(false);
  const { isAuthenticated, walletAddress, connectWallet, disconnectWallet } = useWalletAuth();
  const { profile } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const formatAddress = (address?: string) => {
    if (!address) return "Connect";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleLogout = () => {
    authService.clearProfile();
    disconnectWallet();
  };

  const getRoleLabel = () => {
    if (!profile) return "";
    switch (profile.currentRole) {
      case "owner": return "Owner";
      case "employee": return "Employee";
      case "manager": return "Manager";
      case "auditor": return "Auditor";
      default: return "";
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {profile?.currentOrganization && (
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {profile.currentOrganization.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for transaction, item, etc"
            className="w-[280px] pl-9 bg-secondary border-0 text-sm"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDark(!dark)}
          className="rounded-xl"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative rounded-xl">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <Button
          onClick={isAuthenticated ? handleLogout : connectWallet}
          variant={isAuthenticated ? "outline" : "default"}
          size="sm"
          className="gap-2 rounded-xl"
        >
          {isAuthenticated ? (
            <LogOut className="h-4 w-4" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isAuthenticated ? formatAddress(walletAddress) : "Connect"}
          </span>
        </Button>

        <Avatar className="h-9 w-9 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {profile?.displayName?.charAt(0) || profile?.currentRole?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};