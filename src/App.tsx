import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import Landing from "./pages/Landing";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AuditorDashboard from "./pages/AuditorDashboard";
import BonusVoting from "./pages/BonusVoting";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const pageTitles: Record<string, string> = {
  "/employer": "Dashboard",
  "/employee": "My Dashboard",
  "/auditor": "Auditor",
  "/voting": "Bonus Voting",
  "/notifications": "Notifications",
};

const AppLayout = () => {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const title = pageTitles[location.pathname] || "PriviPay";

  if (isLanding) {
    return <Landing />;
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 ml-[72px]">
        <TopBar title={title} />
        <main className="px-6 pb-8">
          <Routes>
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="/auditor" element={<AuditorDashboard />} />
            <Route path="/voting" element={<BonusVoting />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
