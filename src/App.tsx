import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import Landing from "./pages/Landing";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AuditorDashboard from "./pages/AuditorDashboard";
import BonusVoting from "./pages/BonusVoting";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [connected, setConnected] = useState(false);
  const [walletAddress] = useState("0x1a2B3c4D5e6F7g8H9i0J");

  const handleConnect = () => setConnected(!connected);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar connected={connected} onConnect={handleConnect} walletAddress={walletAddress} />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="/auditor" element={<AuditorDashboard />} />
            <Route path="/voting" element={<BonusVoting />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
