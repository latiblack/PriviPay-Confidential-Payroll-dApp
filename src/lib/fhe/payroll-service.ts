import { Contract, JsonRpcSigner, BrowserProvider, formatUnits } from "ethers";
import { initFhevmInstance, encryptSalary, salaryToCents, centsToSalary, generateKeyPair, KeyPair, handleToHex, isFhevmReady } from "./encryption";

const CONTRACT_ABI = [
  "function addEmployee(address employee, string position, bytes32 inputSalary, bytes inputProof) external",
  "function setSalary(address employee, bytes32 inputSalary, bytes inputProof) external",
  "function getMySalary(address employee) external view returns (bytes32)",
  "function getDecryptedSalary(address employee) external view returns (uint256)",
  "function castVote(address candidate, bytes8 inputVote, bytes inputProof) external",
  "function castVoteFor(address voter, address candidate) external",
  "function distributeBonuses(bytes32 inputThreshold, bytes inputProof) external",
  "function getTotalPayroll() external view returns (uint256)",
  "function getTotalPayrollEncrypted() external view returns (bytes32)",
  "function withdrawSalary(uint256 amount) external",
  "function isEmployee(address) external view returns (bool)",
  "function getEmployeeCount() external view returns (uint256)",
  "function requestJoin() external",
  "function approveJoin(address user) external",
  "function getEmployeeList() external view returns (address[])",
  "event SalarySet(address indexed employee, uint256 encryptedAmount)",
  "event BonusDistributed(address indexed employee, uint256 encryptedAmount)",
  "event VoteCasted(address indexed voter, address indexed candidate)",
  "event JoinRequested(address indexed user)",
  "event JoinApproved(address indexed user)",
  "event EmployeeAdded(address indexed employee, string position)",
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
  private relayerUrl: string = import.meta.env.VITE_RELAYER_URL || "https://relayer.testnet.zama.org";
  private userAddress: string | null = null;

  async initialize(contractAddress: string, provider: BrowserProvider) {
    this.contractAddress = contractAddress;
    this.signer = await provider.getSigner();
    this.userAddress = await this.signer.getAddress();
    this.contract = new Contract(contractAddress, CONTRACT_ABI, this.signer);

    // Initialize FHEvm - don't fail if it doesn't work
    try {
      await initFhevmInstance();
    } catch (e) {
      console.warn("FHEvm initialization failed, using fallback:", e);
    }
  }

  async generateUserKeys(): Promise<FHEWalletKeys> {
    const keyPair = await generateKeyPair();
    this.userKeys = {
      keyPair,
      contractPublicKey: keyPair.publicKey,
    };
    localStorage.setItem("fhe_keys", JSON.stringify(this.userKeys));
    return this.userKeys;
  }

  getUserKeys(): FHEWalletKeys | null {
    if (this.userKeys) return this.userKeys;

    try {
      const stored = localStorage.getItem("fhe_keys");
      if (stored) {
        this.userKeys = JSON.parse(stored);
        return this.userKeys;
      }
    } catch {
      // Ignore storage errors
    }

    return null;
  }

  async getUserKeysAsync(): Promise<FHEWalletKeys> {
    const existing = this.getUserKeys();
    if (existing) return existing;
    return this.generateUserKeys();
  }

  async addEmployee(employeeAddress: string, position: string, salaryInDollars: number): Promise<string> {
    if (!this.contract || !this.signer || !this.contractAddress) {
      throw new Error("Contract not initialized");
    }

    const salaryInCents = salaryToCents(salaryInDollars);
    
    let encryptedHandle = "0x0";
    let proof = "0x";

    try {
      if (isFhevmReady()) {
        const encrypted = await encryptSalary(salaryInCents, this.contractAddress, employeeAddress);
        encryptedHandle = handleToHex(encrypted.handles[0]);
        proof = "0x" + Buffer.from(encrypted.inputProof).toString("hex");
      } else {
        // Fallback: use mock handle
        encryptedHandle = "0x" + "00".repeat(32);
      }
    } catch (e) {
      console.warn("Encryption failed, using mock data:", e);
      encryptedHandle = "0x" + "00".repeat(32);
    }

    const tx = await (this.contract as any).addEmployee(
      employeeAddress,
      position,
      encryptedHandle,
      proof
    );
    await tx.wait();

    return tx.hash;
  }

  async setEmployeeSalary(employeeAddress: string, salaryInDollars: number): Promise<string> {
    if (!this.contract || !this.signer || !this.contractAddress) {
      throw new Error("Contract not initialized");
    }

    const salaryInCents = salaryToCents(salaryInDollars);
    
    let encryptedHandle = "0x0";
    let proof = "0x";

    try {
      if (isFhevmReady()) {
        const encrypted = await encryptSalary(salaryInCents, this.contractAddress, employeeAddress);
        encryptedHandle = handleToHex(encrypted.handles[0]);
        proof = "0x" + Buffer.from(encrypted.inputProof).toString("hex");
      } else {
        encryptedHandle = "0x" + "00".repeat(32);
      }
    } catch (e) {
      console.warn("Encryption failed, using mock data:", e);
      encryptedHandle = "0x" + "00".repeat(32);
    }

    const tx = await (this.contract as any).setSalary(employeeAddress, encryptedHandle, proof);
    await tx.wait();

    return tx.hash;
  }

  async getMySalary(userAddress: string): Promise<string> {
    if (!this.contract) {
      return "***";
    }

    try {
      const decrypted = await (this.contract as any).getDecryptedSalary(userAddress);
      return centsToSalary(Number(decrypted));
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
    if (!this.contract || !this.signer || !this.contractAddress) {
      throw new Error("Contract not initialized");
    }

    const activeEmployees = employees.filter(e => e.status === "active");
    let totalAmount = 0;
    let processed = 0;

    for (let i = 0; i < activeEmployees.length; i++) {
      const emp = activeEmployees[i];
      const amount = parseInt(emp.encryptedSalary);

      if (!isNaN(amount) && amount > 0) {
        try {
          const tx = await this.setEmployeeSalary(emp.address, amount / 100);
          await tx.wait();
          totalAmount += amount;
          processed++;
        } catch (e) {
          console.warn("Failed to set salary for:", emp.address, e);
        }
      }

      onProgress?.(i + 1, activeEmployees.length);
    }

    return {
      totalAmount: centsToSalary(totalAmount),
      txHash: "",
      processed,
    };
  }

  async distributeBonuses(voteThreshold: number): Promise<string> {
    if (!this.contract || !this.signer || !this.contractAddress) {
      throw new Error("Contract not initialized");
    }

    const thresholdCents = salaryToCents(voteThreshold);
    
    let encryptedHandle = "0x0";
    let proof = "0x";

    try {
      if (isFhevmReady()) {
        const encrypted = await encryptSalary(thresholdCents, this.contractAddress, this.userAddress || "0x0");
        encryptedHandle = handleToHex(encrypted.handles[0]);
        proof = "0x" + Buffer.from(encrypted.inputProof).toString("hex");
      } else {
        encryptedHandle = "0x" + "00".repeat(32);
      }
    } catch (e) {
      encryptedHandle = "0x" + "00".repeat(32);
    }

    const tx = await (this.contract as any).distributeBonuses(encryptedHandle, proof);
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

  async getTotalPayroll(): Promise<string> {
    if (!this.contract) {
      return "$0";
    }

    try {
      const total = await (this.contract as any).getTotalPayroll();
      return centsToSalary(Number(total));
    } catch {
      return "$0";
    }
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

  isInitialized(): boolean {
    return !!this.contract;
  }
}

export const fhePayrollService = new FHEPayrollService();
export default fhePayrollService;