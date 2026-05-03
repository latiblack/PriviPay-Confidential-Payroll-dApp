import { initSDK, createInstance, SepoliaConfig, FhevmInstance } from "@zama-fhe/relayer-sdk/web";

let instance: FhevmInstance | null = null;
let sdkInitialized = false;

export const initFhevm = async (provider?: any): Promise<FhevmInstance> => {
  if (instance) return instance;
  
  if (!sdkInitialized) {
    await initSDK();
    sdkInitialized = true;
  }
  
  const network = provider || "https://ethereum-sepolia-rpc.publicnode.com";
  
  instance = await createInstance({
    ...SepoliaConfig,
    network,
  });
  
  return instance;
};

export const encryptSalary = async (amount: number): Promise<string> => {
  const fhe = await initFhevm() as any;
  const encrypted = fhe.encrypt({ euint32: amount });
  return encrypted.euint32;
};

export const encryptBonus = async (amount: number): Promise<string> => {
  const fhe = await initFhevm() as any;
  const encrypted = fhe.encrypt({ euint32: amount });
  return encrypted.euint32;
};

export const encryptAmount = async (amount: number): Promise<string> => {
  const fhe = await initFhevm() as any;
  const encrypted = fhe.encrypt({ euint32: amount });
  return encrypted.euint32;
};

export const decryptValue = async (ciphertext: string): Promise<number> => {
  try {
    const fhe = await initFhevm() as any;
    const decrypted = fhe.decrypt(ciphertext);
    return typeof decrypted === 'number' ? decrypted : 0;
  } catch (err) {
    console.error("FHE decryption failed:", err);
    return 0;
  }
};

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

export const requestDecryption = async (
  contractAddress: string,
  method: string,
  args: any[],
  signerAddress: string
): Promise<string> => {
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

export const isFHEInitialized = (): boolean => {
  return instance !== null;
};