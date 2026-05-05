import { ethers } from "ethers";
import { initFhevm, encryptSalary, encryptBonus, decryptValue } from "./fhe-service";

// Fallback shared address (legacy). New organizations deploy their own contract
// stored on `organizations.contract_address`.
const DEFAULT_PAYROLL_ADDRESS = "0x5EAaE99D017D7De3637c6B7c4C2977eAcCf34512";

const FHE_ABI = [
  "function addEmployee(address employee) external",
  "function removeEmployee(address employee) external",
  "function setEncryptedSalary(address employee, bytes32 encryptedSalary, bytes inputProof) external",
  "function setEncryptedBonus(address employee, bytes32 encryptedBonus, bytes inputProof) external",
  "function getEncryptedSalary(address employee) view returns (bytes32)",
  "function getEncryptedBonus(address employee) view returns (bytes32)",
  "function getEncryptedBalance(address employee) view returns (bytes32)",
  "function grantAccess(address viewer) external",
  "function revokeAccess(address viewer) external",
  "function canViewEmployeeData(address employee, address viewer) view returns (bool)",
  "function processPayrollEncrypted() external returns (bytes32)",
  "function withdrawSalary(bytes32 encryptedAmount, bytes inputProof) external",
  "function getEmployeeCount() external view returns (uint256)",
  "function getEmployee(uint256 index) external view returns (address)",
  "function getAllEmployees() external view returns (address[])",
  "event SalarySetEncrypted(address indexed employee)",
  "event BonusDistributedEncrypted(address indexed employee)",
  "event PayrollProcessedEncrypted(uint256 employeeCount)",
  "event EmployeeAdded(address indexed employee)",
  "event EmployeeRemoved(address indexed employee)",
  "event AccessGranted(address indexed employee, address indexed viewer)",
  "event AccessRevoked(address indexed employee, address indexed viewer)",
  "event SalaryWithdrawn(address indexed employee)",
];

export class FHEContractService {
  private contract: ethers.Contract;
  private address: string;

  constructor(signer: ethers.Signer, contractAddress?: string) {
    this.address = contractAddress || DEFAULT_PAYROLL_ADDRESS;
    this.contract = new ethers.Contract(this.address, FHE_ABI, signer);
  }

  async addEmployee(employeeAddress: string): Promise<ethers.Transaction> {
    const tx = await this.contract.addEmployee(employeeAddress);
    return tx;
  }

  async removeEmployee(employeeAddress: string): Promise<ethers.Transaction> {
    const tx = await this.contract.removeEmployee(employeeAddress);
    return tx;
  }

  async getOwner(): Promise<string> {
    return await this.contract.owner();
  }

  async isEmployee(employeeAddress: string): Promise<boolean> {
    return await this.contract.isEmployee(employeeAddress);
  }

  async setEncryptedSalary(employeeAddress: string, salaryUSD: number): Promise<ethers.Transaction> {
    const signer = this.contract.signer;
    const userAddress = await signer.getAddress();
    const { handle, inputProof } = await encryptSalary(salaryUSD, this.address, userAddress);
    const tx = await this.contract.setEncryptedSalary(employeeAddress, handle, inputProof);
    return tx;
  }

  async setEncryptedBonus(employeeAddress: string, bonusUSD: number): Promise<ethers.Transaction> {
    const signer = this.contract.signer;
    const userAddress = await signer.getAddress();
    const { handle, inputProof } = await encryptBonus(bonusUSD, this.address, userAddress);
    const tx = await this.contract.setEncryptedBonus(employeeAddress, handle, inputProof);
    return tx;
  }

  async getEncryptedSalary(employeeAddress: string): Promise<string> {
    return await this.contract.getEncryptedSalary(employeeAddress);
  }

  async getEncryptedBonus(employeeAddress: string): Promise<string> {
    return await this.contract.getEncryptedBonus(employeeAddress);
  }

  async getEncryptedBalance(employeeAddress: string): Promise<string> {
    return await this.contract.getEncryptedBalance(employeeAddress);
  }

  async getDecryptedBalance(employeeAddress: string): Promise<number> {
    try {
      const signer = this.contract.signer;
      const userAddress = await signer.getAddress();
      const encryptedBalance = await this.contract.getEncryptedBalance(employeeAddress);
      const balance = await decryptValue(encryptedBalance, this.address, signer);
      return balance;
    } catch (err) {
      console.error("Failed to get decrypted balance:", err);
      return 0;
    }
  }

  async grantAccess(viewerAddress: string): Promise<ethers.Transaction> {
    const tx = await this.contract.grantAccess(viewerAddress);
    return tx;
  }

  async revokeAccess(viewerAddress: string): Promise<ethers.Transaction> {
    const tx = await this.contract.revokeAccess(viewerAddress);
    return tx;
  }

  async canViewEmployeeData(employeeAddress: string, viewerAddress: string): Promise<boolean> {
    return await this.contract.canViewEmployeeData(employeeAddress, viewerAddress);
  }

  async processPayroll(): Promise<ethers.Transaction> {
    const tx = await this.contract.processPayrollEncrypted();
    return tx;
  }

  async withdrawSalary(amount: number): Promise<ethers.Transaction> {
    const signer = this.contract.signer;
    const userAddress = await signer.getAddress();
    const { handle, inputProof } = await encryptAmount(amount, this.address, userAddress);
    const tx = await this.contract.withdrawSalary(handle, inputProof);
    return tx;
  }

  async getEmployeeCount(): Promise<number> {
    return await this.contract.getEmployeeCount();
  }

  async getEmployee(index: number): Promise<string> {
    return await this.contract.getEmployee(index);
  }

  async getAllEmployees(): Promise<string[]> {
    return await this.contract.getAllEmployees();
  }

  getContractAddress(): string {
    return this.address;
  }
}

export const createFHEContract = (signer: ethers.Signer, contractAddress?: string): FHEContractService => {
  return new FHEContractService(signer, contractAddress);
};

export const getFHEContractAddress = (): string => {
  return DEFAULT_PAYROLL_ADDRESS;
};