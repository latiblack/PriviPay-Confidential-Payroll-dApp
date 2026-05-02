import { ethers } from "ethers";
import { initFhevm, encryptSalary, encryptBonus } from "./fhe-service";

const FHE_ABI = [
  "function addEmployee(address employee) external",
  "function removeEmployee(address employee) external", 
  "function setEncryptedSalary(address employee, euint256 encryptedSalary) external",
  "function setEncryptedBonus(address employee, euint256 encryptedBonus) external",
  "function getEncryptedSalary(address employee) view returns (euint256)",
  "function getEncryptedBonus(address employee) view returns (euint256)",
  "function processPayrollEncrypted() external returns (euint256)",
  "function getEmployeeCount() external view returns (uint256)",
  "function getEmployee(uint256 index) external view returns (address)",
  "function canViewEmployeeData(address employee) view returns (bool)",
  "event SalarySetEncrypted(address indexed employee)",
  "event BonusDistributedEncrypted(address indexed employee)",
  "event EmployeeAdded(address indexed employee)",
  "event PayrollProcessedEncrypted(uint256 employeeCount)",
];

export class FHEContractService {
  private contract: ethers.Contract;
  
  constructor(address: string, signer: ethers.Signer) {
    this.contract = new ethers.Contract(address, FHE_ABI, signer);
  }

  async addEmployee(employeeAddress: string): Promise<ethers.Transaction> {
    const tx = await this.contract.addEmployee(employeeAddress);
    return tx;
  }

  async setEncryptedSalary(employeeAddress: string, salaryUSD: number): Promise<ethers.Transaction> {
    // First encrypt the salary using FHE
    const encryptedSalary = await encryptSalary(salaryUSD);
    
    // The contract expects euint256 - in practice we'd use the encrypted value directly
    // For now, we'll convert to the format expected by the contract
    const tx = await this.contract.setEncryptedSalary(employeeAddress, encryptedSalary);
    return tx;
  }

  async setEncryptedBonus(employeeAddress: string, bonusUSD: number): Promise<ethers.Transaction> {
    const encryptedBonus = await encryptBonus(bonusUSD);
    const tx = await this.contract.setEncryptedBonus(employeeAddress, encryptedBonus);
    return tx;
  }

  async getEncryptedSalary(employeeAddress: string): Promise<string> {
    return await this.contract.getEncryptedSalary(employeeAddress);
  }

  async getEncryptedBonus(employeeAddress: string): Promise<string> {
    return await this.contract.getEncryptedBonus(employeeAddress);
  }

  async processPayroll(): Promise<ethers.Transaction> {
    const tx = await this.contract.processPayrollEncrypted();
    return tx;
  }

  async getEmployeeCount(): Promise<number> {
    return await this.contract.getEmployeeCount();
  }

  async getEmployee(index: number): Promise<string> {
    return await this.contract.getEmployee(index);
  }

  async canViewEmployeeData(employeeAddress: string): Promise<boolean> {
    return await this.contract.canViewEmployeeData(employeeAddress);
  }
}

export const createFHEContract = (address: string, signer: ethers.Signer): FHEContractService => {
  return new FHEContractService(address, signer);
};