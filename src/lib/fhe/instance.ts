import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

export type FheInstance = Awaited<ReturnType<typeof createInstance>>;

let instance: FheInstance | null = null;

export async function getFheInstance(): Promise<FheInstance> {
  if (!instance) {
    instance = await createInstance({ ...SepoliaConfig });
  }
  return instance;
}

export function resetFheInstance(): void {
  instance = null;
}
