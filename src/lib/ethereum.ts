import { Contract, formatEther, parseEther, ContractTransaction, ethers } from "ethers";

const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_RPC = "https://rpc.sepolia.org";

export interface PayrollTransaction {
  hash: string;
  amount: string;
  recipient: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: Date;
}

class EthereumService {
  private provider: any = null;
  private signer: any = null;
  private userAddress: string = "";

  getSepoliaRPC(): string {
    return import.meta.env.VITE_SEPOLIA_RPC || SEPOLIA_RPC;
  }

  async initialize(dynamicProvider?: any): Promise<boolean> {
    try {
      this.provider = dynamicProvider;
      if (!this.provider) {
        console.warn("No provider provided");
        return false;
      }

      const ethersProvider = new ethers.BrowserProvider(this.provider);
      this.signer = await ethersProvider.getSigner();
      this.userAddress = await this.signer.getAddress();

      return true;
    } catch (err) {
      console.error("Failed to initialize Ethereum service:", err);
      return false;
    }
  }

  async switchToSepolia(dynamicProvider?: any): Promise<{ success: boolean; needsManualSwitch: boolean }> {
    const eth = dynamicProvider;
    if (!eth) return { success: false, needsManualSwitch: true };

    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + SEPOLIA_CHAIN_ID.toString(16) }],
      });
      return { success: true, needsManualSwitch: false };
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await eth.request({
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
          return { success: true, needsManualSwitch: false };
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
          return { success: false, needsManualSwitch: true };
        }
      }
      if (switchError.code === 4001) {
        return { success: false, needsManualSwitch: true };
      }
      return { success: false, needsManualSwitch: true };
    }
  }

  async getCurrentChainId(dynamicProvider?: any): Promise<string | null> {
    try {
      const eth = dynamicProvider || this.provider;
      if (!eth) return null;
      const chainId = await eth.request({ method: "eth_chainId" });
      return chainId;
    } catch {
      return null;
    }
  }

  async getBalance(address?: string, dynamicProvider?: any): Promise<string> {
    try {
      const prov = dynamicProvider || this.provider;
      if (!prov) return "0";
      
      const addr = address || this.userAddress;
      if (!addr) return "0";

      const ethersProvider = new ethers.BrowserProvider(prov);
      const balance = await ethersProvider.getBalance(addr);
      return formatEther(balance);
    } catch (err) {
      console.error("Error getting balance:", err);
      return "0";
    }
  }

  async sendTransaction(to: string, amountInEth: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await this.signer.sendTransaction({
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