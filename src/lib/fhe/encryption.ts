import { initSDK, createInstance, SepoliaConfig, FhevmInstance, KeyPair } from "@zama-fhe/relayer-sdk/web";

export interface EncryptedData {
  handles: bigint[];
  inputProof: Uint8Array;
  type: "euint32" | "euint64" | "euint256" | "euint8";
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

let fhevmInstance: FhevmInstance | null = null;
let fhevmInitialized = false;

export async function initFhevmInstance(): Promise<FhevmInstance> {
  if (fhevmInstance && fhevmInitialized) return fhevmInstance;

  try {
    await initSDK();
    
    fhevmInstance = await createInstance({
      ...SepoliaConfig,
      network: (window as any).ethereum,
    });

    fhevmInitialized = true;
    return fhevmInstance;
  } catch (error) {
    console.error("Failed to initialize FHEvm:", error);
    throw error;
  }
}

export async function generateKeyPair(): Promise<KeyPair> {
  const fhevm = await initFhevmInstance();
  const keys = fhevm.generateKeypair();
  return {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };
}

export async function encryptSalary(amount: number, contractAddress: string, userAddress: string): Promise<EncryptedData> {
  const fhevm = await initFhevmInstance();
  
  const encryptedInput = fhevm.createEncryptedInput(contractAddress, userAddress);
  encryptedInput.add32(BigInt(amount));
  const encrypted = await encryptedInput.encrypt();

  return {
    handles: encrypted.handles,
    inputProof: encrypted.inputProof,
    type: "euint32",
  };
}

export async function decryptSalary(encryptedData: EncryptedData): Promise<number> {
  // Decryption happens on-chain via the contract or relayer
  return 0;
}

export async function reencryptForUser(handle: bigint, userPublicKey: string, contractAddress: string, userAddress: string, privateKey: string, signature: string): Promise<bigint> {
  const fhevm = await initFhevmInstance();
  return fhevm.reencrypt(handle, privateKey, userPublicKey, signature, contractAddress, userAddress);
}

export async function decryptWithPrivateKey(reencryptedData: bigint, privateKey: string): Promise<number> {
  // Decryption happens on-chain
  return 0;
}

export async function encryptVote(voteValue: number, contractAddress: string, userAddress: string): Promise<EncryptedData> {
  const fhevm = await initFhevmInstance();
  
  const encryptedInput = fhevm.createEncryptedInput(contractAddress, userAddress);
  encryptedInput.add8(BigInt(voteValue));
  const encrypted = await encryptedInput.encrypt();

  return {
    handles: encrypted.handles,
    inputProof: encrypted.inputProof,
    type: "euint8",
  };
}

export function formatEncryptedAmount(amount: string | number): string {
  const num = typeof amount === "string" ? parseInt(amount) : amount;
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

export function salaryToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToSalary(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export function isValidEncryptedData(data: any): data is EncryptedData {
  return (
    data &&
    Array.isArray(data.handles) &&
    data.inputProof instanceof Uint8Array &&
    ["euint32", "euint64", "euint256", "euint8"].includes(data.type)
  );
}

export function placeholderSalary(): EncryptedData {
  return {
    handles: [BigInt(0)],
    inputProof: new Uint8Array(64),
    type: "euint32",
  };
}

export function isPlaceholder(data: EncryptedData): boolean {
  return data.handles[0] === BigInt(0);
}

export function maskedSalary(): string {
  return "***";
}

export function maskedAddress(): string {
  return "***...***";
}

export function getFhevmInstance(): FhevmInstance | null {
  return fhevmInstance;
}

export function isFhevmReady(): boolean {
  return fhevmInitialized;
}

export function handleToHex(handle: bigint): string {
  return "0x" + handle.toString(16).padStart(64, "0");
}

export function hexToHandle(hex: string): bigint {
  return BigInt(hex);
}

export function handleToString(handle: bigint | string): string {
  if (typeof handle === "string") return handle;
  return handleToHex(handle);
}

export function handlesToStrings(handles: bigint[]): string[] {
  return handles.map(h => handleToString(h));
}