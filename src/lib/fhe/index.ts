export { getFheInstance, resetFheInstance } from "./instance";
export { encryptUint64, type EncryptedValue } from "./encrypt";
export { decryptUint64 } from "./decrypt";
export {
  deployPayrollContract,
  addEmployee,
  removeEmployee,
  setSalary,
  setBonus,
  processPayroll,
  depositFunds,
  withdrawFunds,
  getBalance,
  getSalary,
  getFundPool,
  getEmployeeCount,
  getAllEmployees,
  checkIsEmployee,
  CONFIDENTIAL_PAYROLL_ABI,
} from "./contract";
