import { createInstance, initSDK, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

export type FheInstance = Awaited<ReturnType<typeof createInstance>>;

let instance: FheInstance | null = null;
let initPromise: Promise<FheInstance> | null = null;

export async function getFheInstance(): Promise<FheInstance> {
  if (instance) return instance;

  // Prevent concurrent init attempts
  if (!initPromise) {
    initPromise = (async () => {
      const relayerUrl =
        import.meta.env.VITE_RELAYER_URL || SepoliaConfig.relayerUrl;

      const sepoliaRpc =
        import.meta.env.VITE_SEPOLIA_RPC || "https://sepolia.infura.io/v3/0e7918e5c02a4d3e9104131ba6d99ac2";

      const config = {
        ...SepoliaConfig,
        relayerUrl,
        // The SDK's FhevmHostChainConfig.fromUserConfig requires a network property
        // (RPC URL string or EIP1193 provider) to connect to the chain
        network: sepoliaRpc,
      };

      try {
        // Initialize WASM modules first (WASM files hosted at public/wasm/)
        await initSDK({
          tfheParams: "/wasm/tfhe_bg.wasm",
          kmsParams: "/wasm/kms_lib_bg.wasm",
        });

        const inst = await createInstance(config);
        instance = inst;
        return inst;
      } catch (e) {
        // Reset so retries can happen
        initPromise = null;
        throw e;
      }
    })();
  }

  return initPromise;
}

export function resetFheInstance(): void {
  instance = null;
  initPromise = null;
}
