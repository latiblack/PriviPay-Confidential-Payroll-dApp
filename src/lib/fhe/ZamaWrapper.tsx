"use client";

import { useEffect, useMemo, useState } from "react";
import { ZamaProvider, IndexedDBStorage, RelayerWeb, SepoliaConfig, type ZamaSDKEvent } from "@zama-fhe/sdk";
import { useChainId } from "wagmi";

const storage = new IndexedDBStorage("KeypairStore", 1);
const sessionStorage = new IndexedDBStorage("SignatureStore", 1);

export interface ZamaWrapperProps {
  children: React.ReactNode;
  signer: any;
}

export const ZamaWrapper = ({ children, signer }: ZamaWrapperProps) => {
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const relayer = useMemo(() => {
    if (!mounted || !signer) return null;
    
    return new RelayerWeb({
      getChainId: () => signer.getChainId?.() || chainId,
      transports: {
        [SepoliaConfig.chainId]: SepoliaConfig,
      },
    });
  }, [mounted, signer, chainId]);

  useEffect(() => {
    return () => {
      if (relayer) {
        relayer.terminate();
      }
    };
  }, [relayer]);

  if (!mounted || !relayer || !signer) {
    return <>{children}</>;
  }

  function dispatchEvent(event: ZamaSDKEvent) {
    window.dispatchEvent(new CustomEvent(event.type, { detail: event }));
  }

  return (
    <ZamaProvider
      relayer={relayer}
      signer={signer}
      storage={storage}
      sessionStorage={sessionStorage}
      onEvent={dispatchEvent}
    >
      {children}
    </ZamaProvider>
  );
};