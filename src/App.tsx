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
import Admin from "./pages/Admin";
import Payroll from "./pages/Payroll";
import Settings from "./pages/Settings";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AuditorDashboard from "./pages/AuditorDashboard";
import BonusVoting from "./pages/BonusVoting";
import Notifications from "./pages/Notifications";
import PendingRole from "./pages/PendingRole";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const pageTitles: Record<string, string> = {
  "/admin": "Admin",
  "/admin/payroll": "Process Payroll",
  "/admin/settings": "Settings",
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
  
  // If user is pending, redirect to pending page
  if (profile.currentRole === "pending") {
    return <Navigate to="/pending" replace />;
  }
  
  // If role is required and user doesn't have it, redirect
  if (requiredRole && profile.currentRole !== requiredRole) {
    // Redirect based on role
    if (profile.currentRole === "owner") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/employee" replace />;
  }
  
  // Redirect owner away from employee-only pages
  if (profile.currentRole === "owner" && window.location.pathname === "/employee") {
    return <Navigate to="/admin" replace />;
  }
  
  // Redirect non-owners from admin pages
  if (profile.currentRole !== "owner" && window.location.pathname.startsWith("/admin")) {
    return <Navigate to="/employee" replace />;
  }
  
  return <>{children}</>;
};

const AppLayout = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const isLanding = location.pathname === "/";
  const isAuth = location.pathname === "/auth";
  const isPending = location.pathname === "/pending";
  const title = pageTitles[location.pathname] || "PriviPay";

  // Only show sidebar when user is authenticated and has an org
  const showSidebar = !isLanding && !isAuth && profile?.currentOrganization;

  if (isLanding) {
    return <Landing />;
  }

  if (isAuth) {
    return <Auth />;
  }

  return (
    <div className="flex min-h-screen">
      {showSidebar && <AppSidebar />}
      <div className={`flex-1 ${showSidebar ? 'ml-[72px]' : ''}`}>
        <TopBar title={title} />
        <main className="px-6 pb-8">
          <Routes>
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="owner">
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/admin/payroll" element={
              <ProtectedRoute requiredRole="owner">
                <Payroll />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requiredRole="owner">
                <Settings />
              </ProtectedRoute>
            } />
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
            <Route path="/pending" element={<PendingRole />} />
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
