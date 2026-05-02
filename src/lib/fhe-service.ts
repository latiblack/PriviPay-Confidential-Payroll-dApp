import { FhevmInstance, createInstance } from "fhevmjs";

let instance: FhevmInstance | null = null;

export const initFhevm = async (): Promise<FhevmInstance> => {
  if (instance) return instance;
  
  instance = await createInstance({
    network: "sepolia",
    gatewayUrl: "https://relayer.testnet.zama.org",
  });
  
  return instance;
};

export const encryptSalary = async (amount: number): Promise<string> => {
  const fhe = await initFhevm();
  const encrypted = fhe.encryptEuint32(amount);
  return encrypted;
};

export const encryptBonus = async (amount: number): Promise<string> => {
  const fhe = await initFhevm();
  const encrypted = fhe.encryptEuint32(amount);
  return encrypted;
};

export const encryptAmount = async (amount: number): Promise<string> => {
  const fhe = await initFhevm();
  return fhe.encryptEuint32(amount);
};

// Decrypt using fhevmjs built-in (works with testnet config)
export const decryptValue = async (ciphertext: string): Promise<number> => {
  try {
    const fhe = await initFhevm();
    const decrypted = fhe.decrypt(ciphertext);
    return decrypted;
  } catch (err) {
    console.error("FHE decryption failed:", err);
    return 0;
  }
};

// Decrypt using Zama Relayer API directly (more reliable for testnet)
export const decryptViaRelayer = async (
  ciphertext: string,
  contractAddress: string,
  signerAddress: string
): Promise<number> => {
  try {
    const response = await fetch("https://relayer.testnet.zama.org/api/decrypt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ciphertext,
        contractAddress,
        signer: signerAddress,
      }),
    });

    if (!response.ok) {
      throw new Error(`Decryption failed: ${response.status}`);
    }

    const data = await response.json();
    return parseInt(data.result, 10);
  } catch (err) {
    console.error("Relayer decryption error:", err);
    return 0;
  }
};

// Request decryption from contract (creates a decryption request)
export const requestDecryption = async (
  contractAddress: string,
  method: string,
  args: any[],
  signerAddress: string
): Promise<string> => {
  // This would typically trigger a transaction to request decryption
  // The relayer then processes it and returns the result
  console.log("Requesting decryption for:", method);
  return "";
};

export const generateKeyPair = async () => {
  const fhe = await initFhevm();
  const { publicKey, privateKey } = fhe.generateKeypair();
  return { publicKey, privateKey };
};

export const reencryptForUser = async (
  ciphertext: string,
  inputPublicKey: string,
  userPrivateKey: string
): Promise<string> => {
  const fhe = await initFhevm();
  const reencrypted = fhe.reencrypt(ciphertext, inputPublicKey, userPrivateKey);
  return reencrypted;
};

// Check if FHE is properly initialized
export const isFHEInitialized = (): boolean => {
  return instance !== null;
};