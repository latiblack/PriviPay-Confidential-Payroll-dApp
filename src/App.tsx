import { useState, lazy, Suspense, Component, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import PendingRole from "./pages/PendingRole";
import PendingInvitations from "./pages/PendingInvitations";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";

// Retry lazy loading on failure
const retryLazy = <T,>(importer: () => Promise<T>, retries = 3): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const attempt = (n: number) => {
      importer()
        .then(resolve)
        .catch((err) => {
          if (n > 0 && err.message?.includes("Failed to fetch")) {
            setTimeout(() => attempt(n - 1), 1000);
          } else {
            reject(err);
          }
        });
    };
    attempt(retries);
  });
};

const Admin = lazy(() => retryLazy(() => import("./pages/Admin")));
const Payments = lazy(() => retryLazy(() => import("./pages/Payments")));
const Settings = lazy(() => retryLazy(() => import("./pages/Settings")));
const EmployerDashboard = lazy(() => retryLazy(() => import("./pages/EmployerDashboard")));
const EmployeeDashboard = lazy(() => retryLazy(() => import("./pages/EmployeeDashboard")));
const AuditorDashboard = lazy(() => retryLazy(() => import("./pages/AuditorDashboard")));
const BonusVoting = lazy(() => retryLazy(() => import("./pages/BonusVoting")));
const Notifications = lazy(() => retryLazy(() => import("./pages/Notifications")));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

// Error boundary for handling chunk loading errors
class ModuleErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Module loading error:", error, errorInfo);
    // Check if it's a chunk loading error
    if (error.message?.includes("Failed to fetch") || error.message?.includes("dynamically imported")) {
      // Attempt to recover by reloading the page
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4">
          <p className="text-lg text-muted-foreground">Failed to load module</p>
          <p className="text-sm text-muted-foreground">Reloading automatically...</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Reload Now
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const pageTitles: Record<string, string> = {
  "/admin": "",
  "/payments": "",
  "/settings": "",
  "/employer": "",
  "/employees": "",
  "/employee": "",
  "/auditor": "",
  "/voting": "",
  "/notifications": "",
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
    const hasValidAccess = profile.currentRole && profile.currentOrganization;
    console.log("ProtectedRoute check:", { currentRole: profile.currentRole, currentOrganization: profile.currentOrganization, hasValidAccess });
    
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
      <div className={`flex-1 ${showSidebar ? 'lg:ml-[72px]' : ''} ${showSidebar ? 'ml-0' : ''}`}>
        <TopBar title={title} />
        <main className="px-3 sm:px-4 lg:px-6 pb-8">
          <Routes>
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="owner">
              <ModuleErrorBoundary><Suspense fallback={<PageLoader />}><Admin /></Suspense></ModuleErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <ModuleErrorBoundary><Suspense fallback={<PageLoader />}><Settings /></Suspense></ModuleErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/employer" element={
            <ProtectedRoute requiredRole="owner">
              <ModuleErrorBoundary><Suspense fallback={<PageLoader />}><EmployerDashboard /></Suspense></ModuleErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute requiredRole="owner">
              <ModuleErrorBoundary><Suspense fallback={<PageLoader />}><EmployeeDashboard /></Suspense></ModuleErrorBoundary>
            </ProtectedRoute>
          } />
<Route path="/employee" element={
            <ProtectedRoute>
              <ModuleErrorBoundary><Suspense fallback={<PageLoader />}><EmployeeDashboard /></Suspense></ModuleErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute>
              <ModuleErrorBoundary><Suspense fallback={<PageLoader />}><Payments /></Suspense></ModuleErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/pending" element={<PendingRole />} />
          <Route path="/invitations" element={<PendingInvitations />} />
          <Route path="/auditor" element={
            <ProtectedRoute>
              <ModuleErrorBoundary><Suspense fallback={<PageLoader />}><AuditorDashboard /></Suspense></ModuleErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/voting" element={
            <ProtectedRoute>
              <ModuleErrorBoundary><Suspense fallback={<PageLoader />}><BonusVoting /></Suspense></ModuleErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <ModuleErrorBoundary><Suspense fallback={<PageLoader />}><Notifications /></Suspense></ModuleErrorBoundary>
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
    <ThemeProvider defaultTheme="light" storageKey="privipay-theme">
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
    </ThemeProvider>
  );
};

export default App;
