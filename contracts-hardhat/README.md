# PriviPay Smart Contracts - Zama fhEVM

Confidential payroll smart contracts using **Zama's Fully Homomorphic Encryption (FHE)** on the fhEVM.

## ⚠️ Setup with Foundry

This project uses **Foundry** for contract development. Foundry is the recommended tool for FHEVM development.

## Prerequisites

1. **Foundry** - Install via:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Testnet ETH** - Get from [Zama Faucet](https://faucet.zama.xyz/)

## Quick Start

### 1. Install Dependencies

```bash
cd contracts-hardhat
npm install
```

Or using Foundry directly:
```bash
forge install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values:
# - PRIVATE_KEY (your deployer wallet private key)
```

### 3. Compile Contracts

```bash
npm run compile
# or
forge build
```

### 4. Deploy to Zama Sepolia Testnet

```bash
npm run deploy:zama
# or
forge script script/Deploy.s.sol --rpc-url zamaSepolia --broadcast --verify
```

### 5. Update Frontend

Copy the deployed contract address to your frontend `.env`:

```
VITE_PAYROLL_CONTRACT_ADDRESS=0x...
```

## Contract Features

### Confidential Salaries
- Salaries stored as encrypted `euint32` (in cents)
- Only employee and owner can view salaries
- Re-encryption for private salary viewing

### Role-Based Access
- **Owner**: Set salaries, approve joins, view totals, distribute bonuses
- **Employees**: View own salary, withdraw (via relayer)

### Encrypted Voting
- Bonus allocation via encrypted votes
- Results computed on encrypted data

## Contract API

### Owner Functions
```solidity
function addEmployee(address employee, string position, bytes32 encryptedSalary) external onlyOwner
function setSalary(address employee, bytes32 encryptedSalary) external onlyOwner
function approveJoin(address user) external onlyOwner
function distributeBonuses(bytes32 voteThreshold) external onlyOwner
function getTotalPayroll() external view onlyOwner returns (uint256)
```

### Employee Functions
```solidity
function getMySalary(address employee, bytes32 publicKey) external view returns (bytes32)
function getDecryptedSalary(address employee) external view returns (uint256)
function withdrawSalary(uint256 amount) external
function requestJoin() external
```

## Zama Testnet Configuration

| Service | Address/URL |
|---------|-------------|
| RPC URL | `https://rpc.sepolia.zama.xyz` |
| Chain ID | `534351` |
| Explorer | `https://sepolia.zama.xyz` |
| Faucet | `https://faucet.zama.xyz` |

## Frontend Integration

The frontend uses `@zama-fhe/relayer-sdk/web` to interact with FHE contracts.

### Installation
```bash
npm install @zama-fhe/relayer-sdk ethers
```

### Usage
```javascript
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import { ethers } from 'ethers';

// Initialize
await initSDK();
const fhe = await createInstance({ ...SepoliaConfig, network: window.ethereum });

// Encrypt
const input = fhe.createEncryptedInput(contractAddr, userAddr);
input.add32(BigInt(500000)); // salary in cents
const encrypted = await input.encrypt();

// Call contract
await contract.setSalary(employeeAddr, encrypted.handles[0], encrypted.inputProof);
```

## Troubleshooting

### "No matching version found"
If you get version errors, run:
```bash
forge install zama-ai/fhevm --no-commit
```

### Build errors
Make sure you have the latest Foundry:
```bash
foundryup
```

## License

BSD-3-Clause-Clear