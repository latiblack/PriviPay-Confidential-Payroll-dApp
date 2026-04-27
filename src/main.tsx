import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
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
  // Enable embedded wallet for email users
  enableEmbeddedWallet: true,
  // Show the Dynamic widget for auth options
  showDynamicWidget: true,
  // Allow multi-wallet connections
  allowMultiWalletConnections: true,
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DynamicContextProvider settings={sdkOptions as any}>
      <App />
      <DynamicWidget />
    </DynamicContextProvider>
  </StrictMode>
);