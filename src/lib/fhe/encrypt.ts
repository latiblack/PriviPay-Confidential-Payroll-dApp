import { getFheInstance } from "./instance";

export interface EncryptedValue {
  handle: string;
  inputProof: string;
}

function toHex(u8: Uint8Array | string): string {
  if (typeof u8 === "string") return u8.startsWith("0x") ? u8 : `0x${u8}`;
  return "0x" + Array.from(u8).map((b) => b.toString(16).padStart(2, "0")).join("");
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
    handle: toHex(encrypted.handles[0] as any),
    inputProof: toHex(encrypted.inputProof as any),
  };
}
