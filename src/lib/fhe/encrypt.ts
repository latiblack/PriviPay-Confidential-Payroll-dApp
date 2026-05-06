import { getFheInstance } from "./instance";

export interface EncryptedValue {
  handle: string;
  inputProof: string;
}

export async function encryptUint64(
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<EncryptedValue> {
  const fhe = await getFheInstance();
  const input = fhe.createEncryptedInput(contractAddress, userAddress);
  input.add64(value);
  const encrypted = await input.encrypt();

  return {
    handle: encrypted.handles[0],
    inputProof: encrypted.inputProof,
  };
}
