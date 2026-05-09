import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface TopBarProps { title: string; }

export const TopBar = ({ title }: TopBarProps) => {
  const { theme, setTheme } = useTheme();
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b bg-background">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg hover:bg-muted">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <ConnectButton />
      </div>
    </header>
  );
};
