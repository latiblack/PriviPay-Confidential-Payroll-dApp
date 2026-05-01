import { BrowserProvider, Contract, formatEther, parseEther, ContractTransaction } from "ethers";

const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_RPC = "https://rpc.sepolia.org";

const PAYROLL_CONTRACT_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function getBalance() external view returns (uint256)",
  "function getPendingWithdrawals(address user) external view returns (uint256)",
  "function owner() external view returns (address)",
  "event Deposited(address user, uint256 amount)",
  "event Withdrawn(address user, uint256 amount)",
];

export interface PayrollTransaction {
  hash: string;
  amount: string;
  recipient: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: Date;
}

class EthereumService {
  private provider: BrowserProvider | null = null;
  private signer: any = null;
  private contract: Contract | null = null;
  private contractAddress: string = "";
  private userAddress: string = "";

  getSepoliaRPC(): string {
    return import.meta.env.VITE_SEPOLIA_RPC || SEPOLIA_RPC;
  }

  getContractAddress(): string {
    return import.meta.env.VITE_PAYROLL_CONTRACT || "";
  }

  async initialize(): Promise<boolean> {
    try {
      if (!window.ethereum) {
        console.warn("MetaMask not installed");
        return false;
      }

      this.provider = new BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.userAddress = await this.signer.getAddress();

      this.contractAddress = this.getContractAddress();
      if (this.contractAddress) {
        this.contract = new Contract(this.contractAddress, PAYROLL_CONTRACT_ABI, this.signer);
      }

      return true;
    } catch (err) {
      console.error("Failed to initialize Ethereum service:", err);
      return false;
    }
  }

  async switchToSepolia(): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + SEPOLIA_CHAIN_ID.toString(16) }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x" + SEPOLIA_CHAIN_ID.toString(16),
              chainName: "Sepolia Testnet",
              nativeCurrency: {
                name: "Sepolia ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [SEPOLIA_RPC],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
          return false;
        }
      }
      return false;
    }
  }

  async getBalance(address?: string): Promise<string> {
    try {
      if (!this.provider) await this.initialize();
      const addr = address || this.userAddress;
      if (!addr) return "0";

      const balance = await this.provider!.getBalance(addr);
      return formatEther(balance);
    } catch (err) {
      console.error("Error getting balance:", err);
      return "0";
    }
  }

  async getContractBalance(): Promise<string> {
    try {
      if (!this.contract) return "0";
      const balance = await this.contract.getBalance();
      return formatEther(balance);
    } catch {
      return "0";
    }
  }

  async getPendingWithdrawal(): Promise<string> {
    try {
      if (!this.contract || !this.userAddress) return "0";
      const pending = await this.contract.getPendingWithdrawals(this.userAddress);
      return formatEther(pending);
    } catch {
      return "0";
    }
  }

  async sendTransaction(to: string, amountInEth: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx: ContractTransaction = await this.signer.sendTransaction({
        to,
        value: parseEther(amountInEth),
      });

      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("Transaction failed:", err);
      throw err;
    }
  }

  async depositToContract(amountInEth: string): Promise<string> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    try {
      const tx = await this.contract.deposit({
        value: parseEther(amountInEth),
      });
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("Deposit failed:", err);
      throw err;
    }
  }

  async withdrawFromContract(amountInEth: string): Promise<string> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    try {
      const tx = await this.contract.withdraw(parseEther(amountInEth));
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("Withdrawal failed:", err);
      throw err;
    }
  }

  async processPayroll(
    employees: { address: string; salary: number }[],
    onProgress?: (current: number, total: number, hash?: string) => void
  ): Promise<{ totalAmount: string; txHashes: string[] }> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const txHashes: string[] = [];
    let totalAmount = 0;

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      if (emp.salary > 0) {
        try {
          const tx = await this.signer.sendTransaction({
            to: emp.address,
            value: parseEther(emp.salary.toString()),
          });
          await tx.wait();
          txHashes.push(tx.hash);
          totalAmount += emp.salary;
          onProgress?.(i + 1, employees.length, tx.hash);
        } catch (err) {
          console.error(`Failed to pay ${emp.address}:`, err);
        }
      }
    }

    return {
      totalAmount: totalAmount.toString(),
      txHashes,
    };
  }

  isConnected(): boolean {
    return !!this.signer;
  }

  getUserAddress(): string {
    return this.userAddress;
  }
}

export const ethereumService = new EthereumService();
export default ethereumService;