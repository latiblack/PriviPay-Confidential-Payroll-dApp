import {
  type WalletClient,
  type PublicClient,
  type Address,
  encodeFunctionData,
  getContractAddress,
  parseAbi,
} from "viem";

export const CONFIDENTIAL_PAYROLL_ABI = parseAbi([
  "constructor()",
  "function owner() view returns (address)",
  "function isEmployee(address) view returns (bool)",
  "function fundPool() view returns (uint256)",
  "function addEmployee(address employee)",
  "function removeEmployee(address employee)",
  "function setSalary(address employee, bytes32 encSalary, bytes calldata inputProof)",
  "function setBonus(address employee, bytes32 encBonus, bytes calldata inputProof)",
  "function processPayroll()",
  "function depositFunds() payable",
  "function withdraw(uint64 amount)",
  "function getBalance(address employee) view returns (bytes32)",
  "function getSalary(address employee) view returns (bytes32)",
  "function getBonus(address employee) view returns (bytes32)",
  "function getEmployeeCount() view returns (uint256)",
  "function getEmployeeAt(uint256 index) view returns (address)",
  "function getAllEmployees() view returns (address[])",
  "event EmployeeAdded(address indexed employee)",
  "event EmployeeRemoved(address indexed employee)",
  "event SalarySet(address indexed employee)",
  "event BonusSet(address indexed employee)",
  "event PayrollProcessed(uint256 employeeCount)",
  "event Withdrawn(address indexed employee, uint256 amount)",
  "event FundsDeposited(address indexed sender, uint256 amount)",
]);

// Contract bytecode will be set after compilation.
// For now, we read it from the compiled artifact at deploy time.
let contractBytecode: `0x${string}` | null = null;

export async function getContractBytecode(): Promise<`0x${string}`> {
  if (contractBytecode) return contractBytecode;
  const artifact = await import("@/lib/contracts/ConfidentialPayroll.json");
  contractBytecode = artifact.bytecode as `0x${string}`;
  return contractBytecode;
}

export async function deployPayrollContract(
  walletClient: WalletClient
): Promise<{ address: string; txHash: string }> {
  const bytecode = await getContractBytecode();
  const account = walletClient.account!;
  const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC;
  const { createPublicClient, http } = await import("viem");

  // Create a read client using the configured RPC
  const publicClient = createPublicClient({
    chain: walletClient.chain!,
    transport: rpcUrl ? http(rpcUrl) : http(),
  });

  // Pre-fetch fee data to avoid MetaMask RPC issues
  let feeData: { maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint } = {};
  try {
    feeData = await publicClient.estimateFeesPerGas();
  } catch (e) {
    console.warn("Fee estimation failed, sending without pre-fetched fees:", e);
  }

  const txHash = await walletClient.deployContract({
    abi: CONFIDENTIAL_PAYROLL_ABI,
    bytecode,
    account,
    chain: walletClient.chain,
    gas: 6_000_000n,
    ...(feeData.maxFeePerGas ? { maxFeePerGas: feeData.maxFeePerGas } : {}),
    ...(feeData.maxPriorityFeePerGas ? { maxPriorityFeePerGas: feeData.maxPriorityFeePerGas } : {}),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    address: receipt.contractAddress!,
    txHash,
  };
}

export async function addEmployee(
  walletClient: WalletClient,
  contractAddress: Address,
  employeeAddress: Address
): Promise<string> {
  return walletClient.writeContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "addEmployee",
    args: [employeeAddress],
    account: walletClient.account!,
    chain: walletClient.chain,
  });
}

export async function removeEmployee(
  walletClient: WalletClient,
  contractAddress: Address,
  employeeAddress: Address
): Promise<string> {
  return walletClient.writeContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "removeEmployee",
    args: [employeeAddress],
    account: walletClient.account!,
    chain: walletClient.chain,
  });
}

export async function setSalary(
  walletClient: WalletClient,
  contractAddress: Address,
  employee: Address,
  handle: string,
  inputProof: string
): Promise<string> {
  return walletClient.writeContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "setSalary",
    args: [employee, handle as `0x${string}`, inputProof as `0x${string}`],
    account: walletClient.account!,
    chain: walletClient.chain,
  });
}

export async function setBonus(
  walletClient: WalletClient,
  contractAddress: Address,
  employee: Address,
  handle: string,
  inputProof: string
): Promise<string> {
  return walletClient.writeContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "setBonus",
    args: [employee, handle as `0x${string}`, inputProof as `0x${string}`],
    account: walletClient.account!,
    chain: walletClient.chain,
  });
}

export async function processPayroll(
  walletClient: WalletClient,
  contractAddress: Address
): Promise<string> {
  return walletClient.writeContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "processPayroll",
    args: [],
    account: walletClient.account!,
    chain: walletClient.chain,
  });
}

export async function depositFunds(
  walletClient: WalletClient,
  contractAddress: Address,
  amountInWei: bigint
): Promise<string> {
  return walletClient.writeContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "depositFunds",
    args: [],
    value: amountInWei,
    account: walletClient.account!,
    chain: walletClient.chain,
  });
}

export async function withdrawFunds(
  walletClient: WalletClient,
  contractAddress: Address,
  amount: bigint
): Promise<string> {
  return walletClient.writeContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "withdraw",
    args: [amount],
    account: walletClient.account!,
    chain: walletClient.chain,
  });
}

export async function getBalance(
  publicClient: any,
  contractAddress: Address,
  employee: Address
): Promise<string> {
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "getBalance",
    args: [employee],
  });
  return result as string;
}

export async function getSalary(
  publicClient: any,
  contractAddress: Address,
  employee: Address
): Promise<string> {
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "getSalary",
    args: [employee],
  });
  return result as string;
}

export async function getFundPool(
  publicClient: any,
  contractAddress: Address
): Promise<bigint> {
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "fundPool",
    args: [],
  });
  return result as bigint;
}

export async function getEmployeeCount(
  publicClient: any,
  contractAddress: Address
): Promise<number> {
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "getEmployeeCount",
    args: [],
  });
  return Number(result);
}

export async function getAllEmployees(
  publicClient: any,
  contractAddress: Address
): Promise<Address[]> {
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "getAllEmployees",
    args: [],
  });
  return result as Address[];
}

export async function checkIsEmployee(
  publicClient: any,
  contractAddress: Address,
  employee: Address
): Promise<boolean> {
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: CONFIDENTIAL_PAYROLL_ABI,
    functionName: "isEmployee",
    args: [employee],
  });
  return result as boolean;
}
