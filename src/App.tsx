import { useState, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import PendingRole from "./pages/PendingRole";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const Admin = lazy(() => import("./pages/Admin"));
const Payments = lazy(() => import("./pages/Payments"));
const Settings = lazy(() => import("./pages/Settings"));
const EmployerDashboard = lazy(() => import("./pages/EmployerDashboard"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const AuditorDashboard = lazy(() => import("./pages/AuditorDashboard"));
const BonusVoting = lazy(() => import("./pages/BonusVoting"));
const Notifications = lazy(() => import("./pages/Notifications"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const queryClient = new QueryClient();

const pageTitles: Record<string, string> = {
  "/admin": "Admin",
  "/payments": "Payments",
  "/admin/settings": "Settings",
  "/employer": "Dashboard",
  "/employees": "Employees",
  "/employee": "My Dashboard",
  "/auditor": "Auditor",
  "/voting": "Bonus",
  "/notifications": "Notifications",
};

// Protected route component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { profile, isLoading } = useAuth();
  const location = useLocation();
  
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
  
  // If role is required and user doesn't have it
  if (requiredRole) {
    if (profile.currentRole !== requiredRole) {
      // Redirect based on role mismatch
      return <Navigate to={profile.currentRole === "owner" ? "/admin" : "/employee"} replace />;
    }
  }
  
  // For routes with no requiredRole - allow access if user has valid role and org
  // This allows owners to access /voting, /notifications, etc.
  if (!requiredRole) {
    // Check if user has a valid role and organization
    const hasValidAccess = profile.currentRole && profile.currentRole !== "pending" && profile.currentOrganization;
    
    if (!hasValidAccess) {
      // No valid access - go to auth
      return <Navigate to="/auth" replace />;
    }
    // Valid access - allow
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
              <Suspense fallback={<PageLoader />}><Admin /></Suspense>
            </ProtectedRoute>
          } />
<Route path="/payments" element={
  <ProtectedRoute requiredRole="owner">
    <Suspense fallback={<PageLoader />}><Payments /></Suspense>
  </ProtectedRoute>
} />
          <Route path="/admin/settings" element={
            <ProtectedRoute requiredRole="owner">
              <Suspense fallback={<PageLoader />}><Settings /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/employer" element={
            <ProtectedRoute requiredRole="owner">
              <Suspense fallback={<PageLoader />}><EmployerDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute requiredRole="owner">
              <Suspense fallback={<PageLoader />}><EmployeeDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/employee" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}><EmployeeDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}><Payments /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/pending" element={<PendingRole />} />
          <Route path="/auditor" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}><AuditorDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/voting" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}><BonusVoting /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}><Notifications /></Suspense>
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
