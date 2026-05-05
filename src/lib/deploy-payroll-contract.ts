import { keccak256, toBytes, type WalletClient, createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import artifact from "./contracts/ConfidentialPayrollFHE.json";

const DEPLOYMENT_GAS_LIMIT = 3_000_000n;
const DEPLOYMENT_TIMEOUT_MS = 180_000;

const SEPOLIA_RPC = "https://sepolia.infura.io/v3/0e7918e5c02a4d3e9104131ba6d99ac2";

const waitForReceipt = async (txHash: string, walletClient: WalletClient): Promise<any> => {
  const pub = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC),
  });

  console.log("Waiting for transaction receipt:", txHash);

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Transaction confirmation timed out")), DEPLOYMENT_TIMEOUT_MS);
  });

  const receiptPromise = pub.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

  return Promise.race([receiptPromise, timeoutPromise]);
};

/**
 * Deploys an org-specific ConfidentialPayrollFHE contract from the connected
 * wallet so the deployer becomes the contract owner. Returns the new contract
 * address and the deployment tx hash.
 */
export async function deployPayrollContract(
  walletClient: WalletClient,
  orgId: string,
): Promise<{ address: string; txHash: string }> {
  if (!walletClient) throw new Error("Wallet client not available");
  if (!walletClient.account) throw new Error("Wallet not connected");

  console.log("Starting contract deployment...");

  const orgIdBytes32 = keccak256(toBytes(orgId));

  console.log("Calling walletClient.deployContract...");

  // Wrap deployContract in a timeout
  const deployPromise = walletClient.deployContract({
    abi: artifact.abi as any,
    bytecode: artifact.bytecode as `0x${string}`,
    args: [orgIdBytes32],
    account: walletClient.account,
    chain: walletClient.chain ?? sepolia,
    gas: DEPLOYMENT_GAS_LIMIT,
  });

  const hash = await Promise.race([
    deployPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Deployment request timed out")), 60000)
    )
  ]);

  console.log("Transaction hash received:", hash);

  const receipt = await waitForReceipt(hash as string, walletClient);

  console.log("Transaction receipt received:", receipt);

  if (!receipt.contractAddress) {
    throw new Error("Deployment succeeded but no contract address returned");
  }

  return { address: receipt.contractAddress, txHash: hash as string };
}
