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

  async initializeWithSigner(walletClient: any): Promise<boolean> {
    try {
      this.signer = walletClient;
      this.userAddress = walletClient.account.address;
      return true;
    } catch (err) {
      console.error("Failed to initialize with signer:", err);
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
      const txParams = {
        to,
        value: parseEther(amountInEth),
      };
      // Use wallet client's sendTransaction directly (wagmi v2 viem returns hash string)
      const tx = await this.signer.sendTransaction({
        account: this.signer.account,
        to: txParams.to,
        value: txParams.value,
      });
      // viem walletClient returns hash as string; ethers returns object with .hash
      return typeof tx === "string" ? tx : tx.hash;
    } catch (err: any) {
      console.error("Transaction failed:", err);
      // Provide more specific error message
      if (err.message?.includes("user rejected")) {
        throw new Error("Transaction rejected by user");
      }
      throw err;
    }
  }

async processPayroll(
    employees: { address: string; salary: number; [key: string]: any }[],
    onProgress?: (current: number, total: number, hash?: string) => void | Promise<void>
  ): Promise<{ totalAmount: string; txHashes: string[] }> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const txHashes: string[] = [];
    let totalAmount = 0;

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      console.log("Processing payroll for:", emp.address, "salary:", emp.salary);
      if (emp.salary > 0) {
        try {
          const tx = await this.signer.sendTransaction({
            account: this.signer.account,
            to: emp.address,
            value: parseEther(emp.salary.toString()),
          });
          // viem returns hash string; ethers returns object with .hash
          const hash = typeof tx === "string" ? tx : tx.hash;
          console.log("Transaction successful, hash:", hash);
          txHashes.push(hash);
          totalAmount += emp.salary;
          await onProgress?.(i + 1, employees.length, hash);
        } catch (err) {
          console.error(`Failed to pay ${emp.address}:`, err);
        }
      }
    }

    return { totalAmount: totalAmount.toString(), txHashes };
  }

  isConnected(): boolean {
    return !!this.signer;
  }

  getUserAddress(): string {
    return this.userAddress;
  }

  async getTransactionHistory(walletAddress: string, limit: number = 20): Promise<PayrollTransaction[]> {
    try {
      // Use the wallet's provider if available, otherwise skip transaction history
      let ethersProvider: ethers.JsonRpcProvider;
      if (this.signer?.provider) {
        ethersProvider = this.signer.provider;
      } else {
        console.warn("No provider available for transaction history, returning empty");
        return [];
      }
      
      // Add timeout for getBlockNumber
      const blockNumberPromise = ethersProvider.getBlockNumber();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout fetching block number")), 10000)
      );
      
      const currentBlock = await Promise.race([blockNumberPromise, timeoutPromise]) as number;
      const startBlock = Math.max(0, currentBlock - 1000); // Look back ~1000 blocks (~4 hours on Sepolia)

      const transactions: PayrollTransaction[] = [];
      
      // Get outbound transfers (sent payments)
      const outboundFilter = {
        fromBlock: startBlock,
        toBlock: currentBlock,
        topics: [
          ethers.id("Transfer(address,address,uint256)"),
          null,
          ethers.zeroPadValue(walletAddress.toLowerCase(), 32)
        ]
      };

      // Get inbound transfers (received payments)
      const inboundFilter = {
        fromBlock: startBlock,
        toBlock: currentBlock,
        topics: [
          ethers.id("Transfer(address,address,uint256)"),
          ethers.zeroPadValue(walletAddress.toLowerCase(), 32)
        ]
      };

      // Fetch logs for outbound transfers
      try {
        const outboundLogs = await ethersProvider.getLogs(outboundFilter);
        for (const log of outboundLogs) {
          const block = await ethersProvider.getBlock(log.blockNumber);
          const tx = await ethersProvider.getTransaction(log.transactionHash);
          
          if (tx) {
            // Parse the transfer amount from log data
            const amount = ethers.formatEther(log.data || "0");
            
            transactions.push({
              hash: log.transactionHash,
              amount: amount,
              recipient: tx.to || "",
              status: block && block.timestamp < Date.now() / 1000 - 12 ? "confirmed" : "pending",
              timestamp: new Date((block?.timestamp || 0) * 1000)
            });
          }
        }
      } catch (e) {
        console.log("No outbound transfers found");
      }

      // Fetch logs for inbound transfers
      try {
        const inboundLogs = await ethersProvider.getLogs(inboundFilter);
        for (const log of inboundLogs) {
          const block = await ethersProvider.getBlock(log.blockNumber);
          const tx = await ethersProvider.getTransaction(log.transactionHash);
          
          if (tx) {
            const amount = ethers.formatEther(log.data || "0");
            
            // Skip if it's the same as outbound (already counted)
            const isDuplicate = transactions.some(t => t.hash === log.transactionHash);
            if (!isDuplicate) {
              transactions.push({
                hash: log.transactionHash,
                amount: amount,
                recipient: tx.from || "",
                status: block && block.timestamp < Date.now() / 1000 - 12 ? "confirmed" : "pending",
                timestamp: new Date((block?.timestamp || 0) * 1000)
              });
            }
          }
        }
      } catch (e) {
        console.log("No inbound transfers found");
      }

      // Sort by timestamp descending and limit
      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return transactions.slice(0, limit);
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      return [];
    }
  }
}

export const ethereumService = new EthereumService();
export default ethereumService;