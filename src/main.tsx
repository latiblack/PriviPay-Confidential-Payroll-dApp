import { createRoot } from "react-dom/client";
import { StrictMode, ReactNode, Component, ErrorInfo } from "react";
import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import App from "./App.tsx";
import "./index.css";

console.log("PriviPay app starting...");

const sdkOptions = {
  environmentId: "c9d199bd-fddd-4e61-97a5-1573e7f1e2e1",
  walletConnectors: [EthereumWalletConnectors],
  enableEmbeddedWallet: true,
  showDynamicWidget: true,
  allowMultiWalletConnections: true,
};

// Error boundary component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("ErrorBoundary caught error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppWithErrorBoundary = () => {
  console.log("Rendering AppWithErrorBoundary...");
  return (
    <ErrorBoundary>
      <DynamicContextProvider settings={sdkOptions as any}>
        <App />
        <DynamicWidget />
      </DynamicContextProvider>
    </ErrorBoundary>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found");
} else {
  console.log("Root element found, mounting React app...");
  createRoot(rootElement).render(
    <StrictMode>
      <AppWithErrorBoundary />
    </StrictMode>
  );
  console.log("React app mounted");
}
