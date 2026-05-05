import * as fhevmjs from "fhevmjs";

let instance: any = null;

export const initFhevm = async (signer: any, contractAddress: string): Promise<any> => {
  if (instance) return instance;
  
  const network = await signer.provider.getNetwork();
  const chainId = network.chainId;
  
  instance = await fhevmjs.createInstance({
    chainId: Number(chainId),
    network: "testnet",
  });
  
  return instance;
};

export interface EncryptedData {
  handle: string;
  inputProof: string;
}

export const encryptSalary = async (amount: number, contractAddress: string, userAddress: string): Promise<EncryptedData> => {
  console.log("encryptSalary called with amount:", amount, "contract:", contractAddress, "user:", userAddress);
  
  const input = fhevmjs.createEncryptedInput(contractAddress, userAddress);
  input.add64(amount);
  const encrypted = await input.encrypt();
  
  console.log("Encrypted handles:", encrypted.handles);
  console.log("Encrypted inputProof:", encrypted.inputProof);
  
  return {
    handle: encrypted.handles[0],
    inputProof: encrypted.inputProof,
  };
};

export const encryptBonus = async (amount: number, contractAddress: string, userAddress: string): Promise<EncryptedData> => {
  console.log("encryptBonus called with amount:", amount, "contract:", contractAddress, "user:", userAddress);
  
  const input = fhevmjs.createEncryptedInput(contractAddress, userAddress);
  input.add64(amount);
  const encrypted = await input.encrypt();
  
  console.log("Encrypted handles:", encrypted.handles);
  console.log("Encrypted inputProof:", encrypted.inputProof);
  
  return {
    handle: encrypted.handles[0],
    inputProof: encrypted.inputProof,
  };
};

export const encryptAmount = async (amount: number, contractAddress: string, userAddress: string): Promise<EncryptedData> => {
  console.log("encryptAmount called with amount:", amount, "contract:", contractAddress, "user:", userAddress);
  
  const input = fhevmjs.createEncryptedInput(contractAddress, userAddress);
  input.add64(amount);
  const encrypted = await input.encrypt();
  
  console.log("Encrypted handles:", encrypted.handles);
  console.log("Encrypted inputProof:", encrypted.inputProof);
  
  return {
    handle: encrypted.handles[0],
    inputProof: encrypted.inputProof,
  };
};

export const decryptValue = async (ciphertext: string, contractAddress: string, signer: any): Promise<number> => {
  try {
    const { userDecryptEuint } = await import("fhevmjs");
    const decrypted = await userDecryptEuint(
      "euint128",
      ciphertext,
      contractAddress,
      signer
    );
    console.log("Decrypted value:", decrypted);
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
  const fhe = await initFhevm() as any;
  const reencrypted = fhe.reencrypt(ciphertext, inputPublicKey, userPrivateKey);
  return reencrypted;
};

export const isFHEInitialized = (): boolean => {
  return instance !== null;
};