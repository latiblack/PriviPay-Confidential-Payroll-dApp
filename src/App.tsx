import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { config } from "./lib/wagmi-config";

const Payments = lazy(() => import("./pages/Payments"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const BonusVoting = lazy(() => import("./pages/BonusVoting"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  if (!state.walletAddress) return <Navigate to="/auth" replace />;
  if (!state.contractAddress) return <Navigate to="/auth" replace />;
  if (!state.isReady) return <PageLoader />;
  return <>{children}</>;
};

const AppLayout = () => {
  const location = useLocation();
  const { state } = useAuth();
  const isLanding = location.pathname === "/";
  const isAuth = location.pathname === "/auth";
  const isDocs = location.pathname === "/docs";
  const showSidebar = state.contractAddress && !isLanding && !isAuth && !isDocs;

  if (isLanding) return <Landing />;
  if (isAuth) return <Auth />;
  if (isDocs) return <Docs />;

  return (
    <div className="flex min-h-screen">
      {showSidebar && <AppSidebar />}
      <div className={`flex-1 ${showSidebar ? 'lg:ml-[72px]' : ''}`}>
        <TopBar title="PriviPay" />
        <main className="px-3 sm:px-4 lg:px-6 pb-8">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
              <Route path="/bonus" element={<ProtectedRoute><BonusVoting /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

const App = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <ThemeProvider defaultTheme="light" storageKey="privipay-theme">
            <TooltipProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/docs" element={<Docs />} />
                    <Route path="/*" element={<AppLayout />} />
                  </Routes>
                </BrowserRouter>
              </AuthProvider>
            </TooltipProvider>
        </ThemeProvider>
      </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
