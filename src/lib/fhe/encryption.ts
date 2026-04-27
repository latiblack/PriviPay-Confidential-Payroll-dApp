import { createInstance, initFhevm, FhevmInstance } from "fhevmjs";

export interface EncryptedData {
  handles: string[];
  inputProof: string;
  type: "euint32" | "euint64" | "euint256" | "euint8";
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

let fhevmInstance: FhevmInstance | null = null;

// Zama fhEVM contract addresses
const ZAMA_CONTRACTS = {
  ACL_CONTRACT: "0x0000000000000000000000000000000000000000", // Will be set from env
  KMS_CONTRACT: "0x0000000000000000000000000000000000000000", // Will be set from env
};

export async function initFhevmInstance(): Promise<FhevmInstance> {
  if (fhevmInstance) return fhevmInstance;

  await initFhevm();

  const aclContractAddress = import.meta.env.VITE_ZAMA_ACL_CONTRACT || ZAMA_CONTRACTS.ACL_CONTRACT;
  const kmsContractAddress = import.meta.env.VITE_ZAMA_KMS_CONTRACT || ZAMA_CONTRACTS.KMS_CONTRACT;

  fhevmInstance = await createInstance({
    chainId: 534351, // Zama fhEVM Sepolia testnet
    networkUrl: "https://devnet.zama.ai",
    gatewayUrl: "https://gateway.devnet.zama.ai",
    aclContractAddress,
    kmsContractAddress,
  });

  return fhevmInstance;
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
  encryptedInput.add32(amount);
  const encrypted = await encryptedInput.encrypt();

  return {
    handles: encrypted.handles.map(h => "0x" + Buffer.from(h).toString("hex")),
    inputProof: "0x" + Buffer.from(encrypted.inputProof).toString("hex"),
    type: "euint32",
  };
}

export async function decryptSalary(encryptedData: EncryptedData): Promise<number> {
  // Decryption happens on-chain via the contract
  // This is a placeholder for client-side verification
  return 0;
}

export async function reencryptForUser(handle: string, userPublicKey: string, contractAddress: string, userAddress: string, privateKey: string, signature: string): Promise<string> {
  const fhevm = await initFhevmInstance();
  const handleBigInt = BigInt(handle);
  const reencrypted = await fhevm.reencrypt(handleBigInt, privateKey, userPublicKey, signature, contractAddress, userAddress);
  return reencrypted.toString();
}

export async function decryptWithPrivateKey(reencryptedData: string, privateKey: string): Promise<number> {
  // Decryption happens on-chain via the contract
  // This is a placeholder for client-side verification
  return 0;
}

export async function encryptVote(employeeAddress: string, contractAddress: string, userAddress: string): Promise<EncryptedData> {
  const fhevm = await initFhevmInstance();
  const encryptedInput = fhevm.createEncryptedInput(contractAddress, userAddress);
  encryptedInput.addAddress(employeeAddress);
  const encrypted = await encryptedInput.encrypt();

  return {
    handles: encrypted.handles.map(h => "0x" + Buffer.from(h).toString("hex")),
    inputProof: "0x" + Buffer.from(encrypted.inputProof).toString("hex"),
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
    typeof data.inputProof === "string" &&
    ["euint32", "euint64", "euint256", "euint8"].includes(data.type)
  );
}

export function placeholderSalary(): EncryptedData {
  return {
    handles: ["0x00000000000000000000000000000000000000000000000000000000deadbeef"],
    inputProof: "0x00000000000000000000000000000000000000000000000000000000deadbeef",
    type: "euint32",
  };
}

export function isPlaceholder(data: EncryptedData): boolean {
  return data.handles[0].includes("deadbeef") || data.inputProof.includes("cafebabe");
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

export function createEIP712Signature(publicKey: string, contractAddress: string, delegatedAccount?: string) {
  const fhevm = fhevmInstance;
  if (!fhevm) throw new Error("FHEvm not initialized");
  return fhevm.createEIP712(publicKey, contractAddress, delegatedAccount);
}
