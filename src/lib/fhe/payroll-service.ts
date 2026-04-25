import { BrowserProvider, Contract, JsonRpcSigner, parseUnits, formatUnits } from "ethers";
import { encryptSalary, decryptSalary, reencryptForUser, decryptWithPrivateKey, placeholderSalary, KeyPair, generateKeyPair, salaryToCents, centsToSalary } from "./encryption";

const CONTRACT_ABI = [
  "function setSalary(address employee, bytes32 encryptedSalary) external",
  "function getMySalary(address employee, bytes32 publicKey) external view returns (bytes32)",
  "function castVoteFor(address voter, address candidate) external",
  "function distributeBonuses(bytes32 voteThreshold) external",
  "function getTotalPayroll() external view returns (bytes32)",
  "function withdrawSalary(uint256 amount, bytes32 publicKey) external",
  "function isEmployee(address) external view returns (bool)",
  "function getEmployeeCount() external view returns (uint256)",
  "function requestJoin() external",
  "function approveJoin(address user) external",
  "event SalarySet(address indexed employee, bytes32 encryptedAmount)",
  "event BonusDistributed(address indexed employee, bytes32 encryptedAmount)",
  "event VoteCasted(address indexed voter, address indexed candidate)",
  "event PayrollProcessed(uint256 totalAmount)",
];

export interface PayrollEmployee {
  address: string;
  encryptedSalary: string;
  position?: string;
  status: "active" | "inactive" | "pending";
  role?: "employee" | "manager" | "auditor";
}

export interface PayrollTransaction {
  id: string;
  employeeAddress: string;
  amount: string;
  status: "pending" | "completed" | "failed";
  txHash?: string;
  timestamp: Date;
}

export interface FHEWalletKeys {
  keyPair: KeyPair;
  contractPublicKey: string;
}

class FHEPayrollService {
  private contractAddress: string | null = null;
  private contract: Contract | null = null;
  private signer: JsonRpcSigner | null = null;
  private userKeys: FHEWalletKeys | null = null;
  private relayerUrl: string = "/api/relayer";

  async initialize(contractAddress: string, provider: BrowserProvider) {
    this.contractAddress = contractAddress;
    this.signer = await provider.getSigner();
    this.contract = new Contract(contractAddress, CONTRACT_ABI, this.signer);
  }

  async generateUserKeys(): Promise<FHEWalletKeys> {
    const keyPair = generateKeyPair();
    this.userKeys = {
      keyPair,
      contractPublicKey: keyPair.publicKey,
    };
    localStorage.setItem("fhe_keys", JSON.stringify(this.userKeys));
    return this.userKeys;
  }

  async getUserKeys(): Promise<FHEWalletKeys | null> {
    if (this.userKeys) return this.userKeys;

    const stored = localStorage.getItem("fhe_keys");
    if (stored) {
      this.userKeys = JSON.parse(stored);
      return this.userKeys;
    }

    return this.generateUserKeys();
  }

  async setEmployeeSalary(employeeAddress: string, salaryInDollars: number): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error("Contract not initialized");
    }

    const salaryInCents = salaryToCents(salaryInDollars);
    const encrypted = encryptSalary(salaryInCents);

    const tx = await (this.contract as any).setSalary(employeeAddress, "0x" + encrypted.bytes);
    await tx.wait();

    return tx.hash;
  }

  async getMySalary(userAddress: string): Promise<string> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    const keys = await this.getUserKeys();
    if (!keys) {
      throw new Error("User keys not generated");
    }

    try {
      const encryptedBytes = await (this.contract as any).getMySalary(
        userAddress,
        "0x" + keys.keyPair.publicKey
      );

      const reencrypted = reencryptForUser(
        { bytes: encryptedBytes.slice(2), type: "euint32" },
        keys.keyPair.publicKey
      );

      const salaryCents = decryptWithPrivateKey(reencrypted, keys.keyPair.privateKey);
      return centsToSalary(salaryCents);
    } catch {
      return "***";
    }
  }

  async castVoteFor(voterAddress: string, candidateAddress: string): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error("Contract not initialized");
    }

    const tx = await (this.contract as any).castVoteFor(voterAddress, candidateAddress);
    await tx.wait();

    return tx.hash;
  }

  async processPayroll(
    employees: PayrollEmployee[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ totalAmount: string; txHash: string; processed: number }> {
    if (!this.contract || !this.signer) {
      throw new Error("Contract not initialized");
    }

    const activeEmployees = employees.filter(e => e.status === "active");
    let totalAmount = 0;
    let processed = 0;

    for (let i = 0; i < activeEmployees.length; i++) {
      const emp = activeEmployees[i];
      const amount = parseInt(emp.encryptedSalary);

      if (!isNaN(amount) && amount > 0) {
        const tx = await (this.contract as any).setSalary(
          emp.address,
          "0x" + encryptSalary(amount).bytes
        );
        await tx.wait();
        totalAmount += amount;
        processed++;
      }

      onProgress?.(i + 1, activeEmployees.length);
    }

    const totalTx = await (this.contract as any).getTotalPayroll();
    const totalFormatted = formatUnits(totalTx, 0);

    return {
      totalAmount: totalFormatted,
      txHash: "",
      processed,
    };
  }

  async distributeBonuses(voteThreshold: number): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error("Contract not initialized");
    }

    const encryptedThreshold = encryptSalary(voteThreshold);
    const tx = await (this.contract as any).distributeBonuses("0x" + encryptedThreshold.bytes);
    await tx.wait();

    return tx.hash;
  }

  async requestJoin(): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error("Contract not initialized");
    }

    const tx = await (this.contract as any).requestJoin();
    await tx.wait();

    return tx.hash;
  }

  async approveJoin(userAddress: string): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error("Contract not initialized");
    }

    const tx = await (this.contract as any).approveJoin(userAddress);
    await tx.wait();

    return tx.hash;
  }

  async isEmployee(address: string): Promise<boolean> {
    if (!this.contract) {
      return false;
    }

    return await (this.contract as any).isEmployee(address);
  }

  async getEmployeeCount(): Promise<number> {
    if (!this.contract) {
      return 0;
    }

    return await (this.contract as any).getEmployeeCount();
  }

  getContractAddress(): string | null {
    return this.contractAddress;
  }

  getUserKeysSync(): FHEWalletKeys | null {
    return this.userKeys;
  }

  setRelayerUrl(url: string) {
    this.relayerUrl = url;
  }
}

export const fhePayrollService = new FHEPayrollService();

export default fhePayrollService;