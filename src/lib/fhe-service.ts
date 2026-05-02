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

export const decryptValue = async (ciphertext: string): Promise<number> => {
  const fhe = await initFhevm();
  const decrypted = fhe.decrypt(ciphertext);
  return decrypted;
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