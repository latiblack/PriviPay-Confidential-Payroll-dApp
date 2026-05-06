import { createRoot } from "react-dom/client";
import { StrictMode, ReactNode, Component, useState, useEffect, useMemo } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./lib/wagmi-config";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { IndexedDBStorage, RelayerWeb, SepoliaConfig } from "@zama-fhe/sdk";
import { WagmiSigner } from "./lib/fhe/wagmiSigner";
import "@rainbow-me/rainbowkit/styles.css";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    <p>Loading PriviPay...</p>
  </div>
);

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("App initialization error:", error);
    this.setState({ error: error as Error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666', margin: '20px 0' }}>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Zama wrapper component that needs wagmi to be ready
const ZamaWrapper = ({ children }: { children: ReactNode }) => {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const signer = useMemo(() => {
    if (!mounted) return null;
    return new WagmiSigner({ config });
  }, [mounted]);
  
  const relayer = useMemo(() => {
    if (!signer || !isConnected) return null;
    return new RelayerWeb({
      getChainId: async () => {
        try {
          return await signer.getChainId();
        } catch {
          return 11155111; // Sepolia
        }
      },
      transports: {
        [SepoliaConfig.chainId]: SepoliaConfig,
      },
    });
  }, [signer, isConnected]);
  
  if (!mounted || !relayer || !signer) {
    return <>{children}</>;
  }
  
  const storage = new IndexedDBStorage("KeypairStore", 1);
  const sessionStorage = new IndexedDBStorage("SignatureStore", 1);
  
  return (
    <ZamaProvider
      relayer={relayer}
      signer={signer}
      storage={storage}
      sessionStorage={sessionStorage}
    >
      {children}
    </ZamaProvider>
  );
};

const SafeWagmiProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <LoadingFallback />;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#3498db',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <ZamaWrapper>
            {children}
          </ZamaWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

const AppWithProviders = () => {
  return (
    <ErrorBoundary>
      <SafeWagmiProvider>
        <App />
      </SafeWagmiProvider>
    </ErrorBoundary>
  );
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = '<div style="padding:40px;text-align:center"><h1>Error</h1><p>Root element not found</p></div>';
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <AppWithProviders />
    </StrictMode>
  );
}