import { getAccount, getWalletClient } from "@wagmi/core";
import { Config } from "wagmi";

export class WagmiSigner {
  private config: Config;
  private chainIdFn: () => Promise<number>;

  constructor({ config, getChainId }: { config: Config; getChainId?: () => Promise<number> }) {
    this.config = config;
    this.chainIdFn = getChainId || (async () => {
      const account = getAccount(this.config);
      // Default to Sepolia chain ID if not connected
      return account.chainId || 11155111;
    });
  }

  async getAddress(): Promise<string> {
    const account = getAccount(this.config);
    if (!account.address) throw new Error("No address found");
    return account.address;
  }

  async getChainId(): Promise<number> {
    return this.chainIdFn();
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    const walletClient = await getWalletClient(this.config);
    if (!walletClient) throw new Error("No wallet client");
    
    const messageStr = typeof message === "string" ? message : Buffer.from(message).toString("hex");
    return walletClient.signMessage({ message: messageStr });
  }

  async signTypedData(domain: any, types: any, message: any): Promise<string> {
    const walletClient = await getWalletClient(this.config);
    if (!walletClient) throw new Error("No wallet client");
    
    return walletClient.signTypedData({
      domain,
      types,
      primaryType: Object.keys(types)[0],
      message,
    });
  }
}