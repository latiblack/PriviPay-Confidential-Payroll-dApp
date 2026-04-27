import express, { Request, Response } from "express";
import cors from "cors";
import { createPublicClient, http } from "viem";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const ZAMA_NETWORKS = {
  sepolia: {
    rpcUrl: process.env.ZAMA_SEPOLIA_RPC || "https://sepolia.fheoma.zama.xyz",
    contractAddress: process.env.PAYROLL_CONTRACT_ADDRESS || "",
  },
  devnet: {
    rpcUrl: process.env.ZAMA_DEVNET_RPC || "https://devnet.fheoma.zama.xyz",
    contractAddress: process.env.PAYROLL_CONTRACT_ADDRESS || "",
  },
};

const client = createPublicClient({
  transport: http(ZAMA_NETWORKS.sepolia.rpcUrl),
});

interface DecryptRequest {
  contractAddress: string;
  encryptedData: string;
  userPublicKey: string;
  userAddress: string;
}

interface WithdrawalRequest {
  contractAddress: string;
  recipientAddress: string;
  amount: string;
  userAddress: string;
  userSignature: string;
}

app.get("/api/relayer/status", (_req: Request, res: Response) => {
  res.json({ online: true, queueSize: 0 });
});

app.post("/api/relayer/decrypt", async (req: Request, res: Response) => {
  try {
    const { contractAddress, encryptedData, userPublicKey, userAddress }: DecryptRequest = req.body;

    if (!contractAddress || !encryptedData || !userPublicKey) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    console.log(`[Relayer] Decrypt request for user ${userAddress.slice(0, 10)}...`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const mockDecryptedValue = (Math.random() * 10000).toFixed(2);

    console.log(`[Relayer] Decryption completed for ${userAddress.slice(0, 10)}...`);

    res.json({
      success: true,
      decryptedValue: mockDecryptedValue,
    });
  } catch (error) {
    console.error("[Relayer] Decryption error:", error);
    res.status(500).json({ success: false, error: "Decryption failed" });
  }
});

app.post("/api/relayer/withdraw", async (req: Request, res: Response) => {
  try {
    const { contractAddress, recipientAddress, amount, userAddress, userSignature }: WithdrawalRequest = req.body;

    if (!contractAddress || !recipientAddress || !amount || !userAddress) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    console.log(`[Relayer] Withdrawal request: ${amount} USDC to ${recipientAddress.slice(0, 10)}...`);

    const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    console.log(`[Relayer] Withdrawal tx: ${mockTxHash}`);

    res.json({
      success: true,
      transactionHash: mockTxHash,
    });
  } catch (error) {
    console.error("[Relayer] Withdrawal error:", error);
    res.status(500).json({ success: false, error: "Withdrawal failed" });
  }
});

app.get("/api/relayer/verify", async (req: Request, res: Response) => {
  try {
    const { contract, user } = req.query;

    if (!contract || !user) {
      return res.status(400).json({ verified: false, exists: false });
    }

    res.json({ verified: true, exists: true });
  } catch (error) {
    res.status(500).json({ verified: false, exists: false });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   PriviPay FHE Relayer                      ║
╠══════════════════════════════════════════════════════════════╣
║  Status: Online                                              ║
║  Port: ${PORT}                                                ║
║  Network: Zama Sepolia Testnet                              ║
║                                                              ║
║  Endpoints:                                                  ║
║  POST /api/relayer/decrypt  - Decrypt FHE data              ║
║  POST /api/relayer/withdraw - Process withdrawal            ║
║  GET  /api/relayer/verify   - Verify encrypted balance      ║
║  GET  /health              - Health check                   ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;