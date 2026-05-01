import { Search, Bell, MessageSquare, Wallet, Sun, Moon, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ui/theme-provider";
import { authService } from "@/lib/auth-service";
import { supabase } from "@/integrations/supabase/client";

interface TopBarProps {
  title: string;
}

export const TopBar = ({ title }: TopBarProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated, walletAddress, connectWallet, disconnectWallet } = useWalletAuth();
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!profile?.currentOrganization?.id || !walletAddress) return;
    
    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("id, read, user_id, type")
        .eq("organization_id", profile.currentOrganization.id)
        .eq("read", false);
      
      if (!error && data) {
        let filtered = data;
        const role = profile.currentRole;
        
        if (role === "owner") {
          filtered = data.filter((n: any) => 
            n.type === "join_request" || 
            n.type === "vote_started" || 
            n.type === "vote_ended" || 
            n.type === "new_vote" ||
            n.user_id === null
          );
        } else {
          filtered = data.filter((n: any) => 
            n.user_id === walletAddress ||
            n.user_id === null
          );
        }
        
        setUnreadCount(filtered.length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile?.currentOrganization?.id, walletAddress, profile?.currentRole]);

  useEffect(() => {
    if (!profile?.currentOrganization?.id) return;

    const channel = supabase
      .channel("notifications:topbar")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `organization_id=eq.${profile.currentOrganization.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.currentOrganization?.id]);

  const formatAddress = (address?: string) => {
    if (!address) return "Connect";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleLogout = () => {
    authService.clearProfile();
    disconnectWallet();
  };

  const handleNotificationsClick = () => {
    navigate("/notifications");
  };

  const getRoleLabel = () => {
    if (!profile) return "";
    switch (profile.currentRole) {
      case "owner": return "Owner";
      case "staff": return "Staff";
      case "manager": return "Manager";
      case "auditor": return "Auditor";
      default: return "";
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
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
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="rounded-xl"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-xl"
          onClick={handleNotificationsClick}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
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