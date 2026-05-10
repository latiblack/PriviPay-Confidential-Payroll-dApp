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
  getBonus,
  getFundPool,
  getEmployeeCount,
  getAllEmployees,
  checkIsEmployee,
  getTotalCompensation,
  updateTotalCompensation,
  CONFIDENTIAL_PAYROLL_ABI,
} from "./contract";
