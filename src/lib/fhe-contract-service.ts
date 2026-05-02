import { ethers } from "ethers";
import { initFhevm, encryptSalary, encryptBonus } from "./fhe-service";

const CONFIDENTIAL_PAYROLL_ADDRESS = "0x2f8457EA818590aaEc5DCCA155828bf691A0Ba84";

const FHE_ABI = [
  "function addEmployee(address employee) external",
  "function removeEmployee(address employee) external",
  "function setEncryptedSalary(address employee, euint256 encryptedSalary) external",
  "function setEncryptedBonus(address employee, euint256 encryptedBonus) external",
  "function getEncryptedSalary(address employee) view returns (euint256)",
  "function getEncryptedBonus(address employee) view returns (euint256)",
  "function getEncryptedBalance(address employee) view returns (euint256)",
  "function grantAccess(address viewer) external",
  "function revokeAccess(address viewer) external",
  "function canViewEmployeeData(address employee, address viewer) view returns (bool)",
  "function processPayrollEncrypted() external returns (euint256)",
  "function withdrawSalary(euint256 encryptedAmount) external",
  "function getEmployeeCount() external view returns (uint256)",
  "function getEmployee(uint256 index) external view returns (address)",
  "function getAllEmployees() external view returns (address[])",
  "event SalarySetEncrypted(address indexed employee)",
  "event BonusDistributedEncrypted(address indexed employee)",
  "event PayrollProcessedEncrypted(uint256 employeeCount)",
  "event EmployeeAdded(address indexed employee)",
  "event EmployeeRemoved(address indexed employee)",
  "event AccessGranted(address indexed employee, address indexed viewer)",
  "event SalaryWithdrawn(address indexed employee)",
];

export class FHEContractService {
  private contract: ethers.Contract;
  
  constructor(signer: ethers.Signer) {
    this.contract = new ethers.Contract(CONFIDENTIAL_PAYROLL_ADDRESS, FHE_ABI, signer);
  }

  async addEmployee(employeeAddress: string): Promise<ethers.Transaction> {
    const tx = await this.contract.addEmployee(employeeAddress);
    return tx;
  }

  async removeEmployee(employeeAddress: string): Promise<ethers.Transaction> {
    const tx = await this.contract.removeEmployee(employeeAddress);
    return tx;
  }

  async setEncryptedSalary(employeeAddress: string, salaryUSD: number): Promise<ethers.Transaction> {
    const encryptedSalary = await encryptSalary(salaryUSD);
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

  async getEncryptedBalance(employeeAddress: string): Promise<string> {
    return await this.contract.getEncryptedBalance(employeeAddress);
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

  async withdrawSalary(encryptedAmount: string): Promise<ethers.Transaction> {
    const tx = await this.contract.withdrawSalary(encryptedAmount);
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
    return CONFIDENTIAL_PAYROLL_ADDRESS;
  }
}

export const createFHEContract = (signer: ethers.Signer): FHEContractService => {
  return new FHEContractService(signer);
};

export const getFHEContractAddress = (): string => {
  return CONFIDENTIAL_PAYROLL_ADDRESS;
};