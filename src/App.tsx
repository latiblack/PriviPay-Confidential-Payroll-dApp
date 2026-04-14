import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AuditorDashboard from "./pages/AuditorDashboard";
import BonusVoting from "./pages/BonusVoting";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const pageTitles: Record<string, string> = {
  "/employer": "Dashboard",
  "/employees": "Employees",
  "/employee": "My Dashboard",
  "/auditor": "Auditor",
  "/voting": "Bonus Voting",
  "/notifications": "Notifications",
};

// Protected route component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!profile) {
    return <Navigate to="/auth" replace />;
  }
  
  // If role is required and user doesn't have it, redirect
  if (requiredRole && profile.currentRole !== requiredRole) {
    // Redirect based on role
    if (profile.currentRole === "owner") {
      return <Navigate to="/employer" replace />;
    }
    return <Navigate to="/employee" replace />;
  }
  
  return <>{children}</>;
};

const AppLayout = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const isLanding = location.pathname === "/";
  const isAuth = location.pathname === "/auth";
  const title = pageTitles[location.pathname] || "PriviPay";

  if (isLanding) {
    return <Landing />;
  }

  if (isAuth) {
    return <Auth />;
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 ml-[72px]">
        <TopBar title={title} />
        <main className="px-6 pb-8">
          <Routes>
            <Route path="/employer" element={
              <ProtectedRoute requiredRole="owner">
                <EmployerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute requiredRole="owner">
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/employee" element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/auditor" element={
              <ProtectedRoute>
                <AuditorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/voting" element={
              <ProtectedRoute>
                <BonusVoting />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
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
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
