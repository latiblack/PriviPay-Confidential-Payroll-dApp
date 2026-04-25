export interface RelayerConfig {
  url: string;
  apiKey?: string;
}

export interface DecryptRequest {
  contractAddress: string;
  encryptedData: string;
  userPublicKey: string;
  userAddress: string;
}

export interface DecryptResponse {
  success: boolean;
  decryptedValue?: string;
  error?: string;
}

export interface WithdrawalRequest {
  contractAddress: string;
  recipientAddress: string;
  amount: string;
  userAddress: string;
  userSignature: string;
}

export interface WithdrawalResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

class RelayerService {
  private config: RelayerConfig = {
    url: import.meta.env.VITE_RELAYER_URL || "https://relayer.privipay.com",
  };

  setConfig(config: RelayerConfig) {
    this.config = config;
  }

  async decryptSalary(request: DecryptRequest): Promise<DecryptResponse> {
    try {
      const response = await fetch(`${this.config.url}/api/relayer/decrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && { "Authorization": `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Relayer error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Relayer decryption error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async submitWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      const response = await fetch(`${this.config.url}/api/relayer/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && { "Authorization": `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Relayer error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Relayer withdrawal error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async verifyEncryptedBalance(
    contractAddress: string,
    userAddress: string
  ): Promise<{ verified: boolean; exists: boolean }> {
    try {
      const response = await fetch(
        `${this.config.url}/api/relayer/verify?contract=${contractAddress}&user=${userAddress}`,
        {
          headers: {
            ...(this.config.apiKey && { "Authorization": `Bearer ${this.config.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        return { verified: false, exists: false };
      }

      return await response.json();
    } catch (error) {
      console.error("Balance verification error:", error);
      return { verified: false, exists: false };
    }
  }

  async getRelayerStatus(): Promise<{ online: boolean; queueSize: number }> {
    try {
      const response = await fetch(`${this.config.url}/api/relayer/status`);
      if (!response.ok) {
        return { online: false, queueSize: -1 };
      }
      return await response.json();
    } catch {
      return { online: false, queueSize: -1 };
    }
  }
}

export const relayerService = new RelayerService();
export default relayerService;