export type Role = "employer" | "employee" | "auditor";

export interface Employee {
  id: string;
  address: string;
  name: string;
  role: string;
  encryptedSalary: string;
  decryptedSalary?: number;
  encryptedBonus: string;
  decryptedBonus?: number;
  lastPaid?: string;
}

export interface BonusVote {
  id: string;
  employeeName: string;
  employeeId: string;
  votes: number;
  totalVoters: number;
  status: "active" | "completed";
  encryptedResult: string;
}

export const mockEmployees: Employee[] = [
  {
    id: "1",
    address: "0x1a2B...3c4D",
    name: "Alice Johnson",
    role: "Senior Developer",
    encryptedSalary: "euint256(0x7f3a...)",
    decryptedSalary: 8500,
    encryptedBonus: "euint256(0x2b1c...)",
    decryptedBonus: 1200,
    lastPaid: "2025-04-01",
  },
  {
    id: "2",
    address: "0x5e6F...7g8H",
    name: "Bob Smith",
    role: "Product Manager",
    encryptedSalary: "euint256(0x4d2e...)",
    decryptedSalary: 9000,
    encryptedBonus: "euint256(0x8f3d...)",
    decryptedBonus: 1500,
    lastPaid: "2025-04-01",
  },
  {
    id: "3",
    address: "0x9i0J...1k2L",
    name: "Carol Williams",
    role: "Designer",
    encryptedSalary: "euint256(0x6a5b...)",
    decryptedSalary: 7000,
    encryptedBonus: "euint256(0x1e9f...)",
    decryptedBonus: 800,
    lastPaid: "2025-04-01",
  },
  {
    id: "4",
    address: "0x3m4N...5o6P",
    name: "David Brown",
    role: "Backend Engineer",
    encryptedSalary: "euint256(0x9c8d...)",
    decryptedSalary: 8000,
    encryptedBonus: "euint256(0x3a2b...)",
    decryptedBonus: 1000,
    lastPaid: "2025-03-01",
  },
  {
    id: "5",
    address: "0x7q8R...9s0T",
    name: "Eva Martinez",
    role: "DevOps Lead",
    encryptedSalary: "euint256(0x2f1e...)",
    decryptedSalary: 8200,
    encryptedBonus: "euint256(0x5c4d...)",
    decryptedBonus: 1100,
    lastPaid: "2025-04-01",
  },
];

export const mockBonusVotes: BonusVote[] = [
  {
    id: "v1",
    employeeName: "Alice Johnson",
    employeeId: "1",
    votes: 3,
    totalVoters: 4,
    status: "active",
    encryptedResult: "euint256(pending...)",
  },
  {
    id: "v2",
    employeeName: "Bob Smith",
    employeeId: "2",
    votes: 4,
    totalVoters: 4,
    status: "completed",
    encryptedResult: "euint256(0xab12...)",
  },
  {
    id: "v3",
    employeeName: "Carol Williams",
    employeeId: "3",
    votes: 2,
    totalVoters: 4,
    status: "active",
    encryptedResult: "euint256(pending...)",
  },
];

export const totalEncryptedPayroll = "euint256(0xff42...)";
export const totalDecryptedPayroll = 40700;
export const totalEncryptedBonuses = "euint256(0xee31...)";
export const totalDecryptedBonuses = 5600;
