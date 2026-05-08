import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

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

      const config = {
        ...SepoliaConfig,
        relayerUrl,
      };

      try {
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
