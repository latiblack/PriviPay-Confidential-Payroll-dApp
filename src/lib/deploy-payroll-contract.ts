import { keccak256, toBytes, type WalletClient } from "viem";
import { sepolia } from "viem/chains";
import { publicActions } from "viem";
import artifact from "./contracts/ConfidentialPayrollFHE.json";

const DEPLOYMENT_GAS_LIMIT = 3_000_000n;

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

  const orgIdBytes32 = keccak256(toBytes(orgId));

  const hash = await walletClient.deployContract({
    abi: artifact.abi as any,
    bytecode: artifact.bytecode as `0x${string}`,
    args: [orgIdBytes32],
    account: walletClient.account,
    chain: walletClient.chain ?? sepolia,
    gas: DEPLOYMENT_GAS_LIMIT,
  });

  const publicClient = walletClient.extend(publicActions);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) {
    throw new Error("Deployment succeeded but no contract address returned");
  }

  return { address: receipt.contractAddress, txHash: hash };
}
