import { createRoot } from "react-dom/client";
import { StrictMode, Component, ReactNode } from "react";
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

class WalletProviderBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Dynamic wallet provider failed to initialize", error);
  }

  render() {
    if (this.state.hasError) {
      return <App />;
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProviderBoundary>
      <DynamicContextProvider settings={sdkOptions as any}>
        <App />
        <DynamicWidget />
      </DynamicContextProvider>
    </WalletProviderBoundary>
  </StrictMode>
);
