import { getFheInstance } from "./instance";
import type { WalletClient } from "viem";

export async function decryptUint64(
  handle: string,
  contractAddress: string,
  walletClient: WalletClient
): Promise<number> {
  const fhe = await getFheInstance();
  const keypair = fhe.generateKeypair();

  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 1;

  const eip712 = fhe.createEIP712(
    keypair.publicKey,
    [contractAddress],
    startTimestamp,
    durationDays
  );

  const signature = await walletClient.signTypedData({
    account: walletClient.account!,
    ...eip712,
  });

  const results = await fhe.userDecrypt(
    [{ handle, contractAddress }],
    keypair.privateKey,
    keypair.publicKey,
    signature,
    [contractAddress],
    walletClient.account!.address,
    startTimestamp,
    durationDays
  );

  return Number(results[0]);
}
