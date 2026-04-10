import { Search, Bell, MessageSquare, Wallet, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

interface TopBarProps {
  title: string;
  connected: boolean;
  onConnect: () => void;
  walletAddress?: string;
}

export const TopBar = ({ title, connected, onConnect, walletAddress }: TopBarProps) => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>

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

        <Button variant="ghost" size="icon" className="rounded-xl">
          <MessageSquare className="h-5 w-5" />
        </Button>

        <Button
          onClick={onConnect}
          variant={connected ? "outline" : "default"}
          size="sm"
          className="gap-2 rounded-xl"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">
            {connected
              ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
              : "Connect"}
          </span>
        </Button>

        <Avatar className="h-9 w-9 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            PP
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
