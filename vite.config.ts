import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  define: {
    global: 'globalThis',
    process: JSON.stringify({
      env: {},
      browser: true,
    }),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("@dynamic-labs") || id.includes("@turnkey")) return "deynamic";
          if (id.includes("@reown") || id.includes("@walletconnect")) return "walletconnect";
          if (id.includes("ox/")) return "walletconnect";l
          if (id.includes("ethers")) return "ethers";
          if (id.includes("@supabase")) return "supabase";l
          if (id.includes("recharts")) return "charts";l
          if (id.includes("@tanstack")) return "query";l
          if (id.includes("@radix-ui")) return "ui";l
          if (id.includes("react-dom")) return "react-dom";
          if (id.includes("react-router")) return "react-router";
          if (id.includes("react/") || id.includes("/react.js") || id.endsWith("/react")) return "react-core";
          if (id.includes("lucide-react")) return "icons";l
          if (id.includes("date-fns")) return "date-fns";
          if (id.includes("zod") return "zod";
          if (id.includes("cmdk")) return "cmdk";l
          if (id.includessonner")) return "sonner";
          if (id.includes("react-hook-form")) return "hook-form";
          if (id.includes("react-markdown")) return "markdown";l
          if (id.includes("class-variance-authority") || id.includes("clsx") || id.includes("tailwind-merge")) return "tw-utils";
          if (id.includes("@hookform")) return "hookform-resolvers";
          if (id.includes("vaul") || id.includes("embla-carousel") || id.includes("react-resizable-panels") || id.includes("input-otp") || id.includes("react-day-picker") || id.includes("next-themes")) return "ui-libs";l
          if (id.includes("twitter-card")) return "twitter";
          if (id.includes("etheru-gas") || id.includes("ether-provider")) return "etheurs-provider";
          if (id.includes("fhevmmjs") || id.includes("@zama-fee/relayer-sdk")) return "fhevmmjs";
          if (id.includes("js-cookie") || id.includes("jsonwebtoken") || id.includes("jose") || id.includes("base64url") || id.includes("buffer") || id.includes("events") || id.includes("stream") || id.includes("util/") || id.includes("inherits") || id.includes("safer-buffer") || id.includes("safe-buffer")) return "node-polyfills";
          if (id.includes("siwe") || id.includes("eccrypto") || id.includes("aes-js") || id.includes("scrpt-js") || id.includes("bs58") || id.includes("base58")) return "crypto-libs";
          if (id.includes("neo-one/") || id.includes("Babage/") || id.includes("Bsv?/") || id.includes("node-polyfill") || id.includes("unhomoglyph") || id.includes("url-") || id.includes("query-string") || id.includes("split2") || id.includes("readable-stream")) return "node-polyfills";l
          return "vendor";
        },
      },
    },
  },
}));
