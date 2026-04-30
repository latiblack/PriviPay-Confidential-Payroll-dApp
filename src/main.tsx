import { createRoot } from "react-dom/client";
import { StrictMode, ReactNode, Component, useState, useEffect } from "react";
import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import App from "./App.tsx";
import "./index.css";

const sdkOptions = {
  environmentId: "c9d199bd-fddd-4e61-97a5-1573e7f1e2e1",
  walletConnectors: [EthereumWalletConnectors],
  enableEmbeddedWallet: true,
  showDynamicWidget: true,
  allowMultiWalletConnections: true,
};

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
    console.error("Dynamic wallet provider failed to initialize", error);
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

const SafeDynamicProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setReady(true);
      } catch (e) {
        console.error("Dynamic init error:", e);
        setError((e as Error).message);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  if (!ready) {
    return <LoadingFallback />;
  }

  return (
    <DynamicContextProvider settings={sdkOptions as any}>
      {children}
    </DynamicContextProvider>
  );
};

const AppWithProviders = () => {
  return (
    <ErrorBoundary>
      <SafeDynamicProvider>
        <App />
        <DynamicWidget />
      </SafeDynamicProvider>
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