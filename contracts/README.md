# PriviPay Smart Contracts

Confidential payroll contracts using Zama's fhEVM (Fully Homomorphic Encryption on Ethereum)

## Architecture

```
contracts/
├── src/
│   ├── ConfidentialPayroll.sol    # Main FHE payroll contract
│   └── interfaces/
│       └── IFHE.sol               # TFHE interface
├── script/
│   └── Deploy.s.sol               # Deployment script
├── lib/
│   └── (Zama fhEVM libraries)     # Pulled via forge install zama-fhe/fhevm
└── test/
    └── ConfidentialPayroll.t.sol  # Test contract
```

## Prerequisites

1. **Install Foundry**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install Zama's fhEVM**
   ```bash
   forge install zama-fhe/fhevm --no-commit
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values:
   # DEPLOYER_PRIVATE_KEY=your_key
   # ZAMA_FHEVM_RPC_URL=https://devnet.fheoma.zama.xyz
   # ZAMA_FHEVM_API_KEY=your_api_key
   ```

## Compile Contracts

```bash
forge build
```

## Run Tests

```bash
forge test
```

## Deploy to Zama Testnet

```bash
# Option 1: Using Make
make deploy-testnet

# Option 2: Manual
forge script script/Deploy.s.sol \
  --rpc-url zama_fhevm_sepolia \
  --broadcast \
  --verify
```

## Deploy to Mainnet

```bash
forge script script/Deploy.s.sol \
  --rpc-url zama_fhevm \
  --broadcast \
  --verify
```

## Key FHE Concepts

### Encrypted Data Types
- `euint32`: Encrypted 32-bit unsigned integer (for salaries in cents)
- `euint8`: Encrypted 8-bit unsigned integer (for vote counts)
- `euint256`: Encrypted 256-bit unsigned integer (for totals)

### Supported Operations
- `TFHE.add(a, b)`: Encrypted addition
- `TFHE.sub(a, b)`: Encrypted subtraction
- `TFHE.ge(a, b)`: Encrypted comparison (greater than or equal)
- `TFHE.select(condition, a, b)`: Encrypted conditional selection
- `Reencrypt.reencrypt(encrypted, publicKey)`: Re-encrypt for specific user

### Privacy Model
- **Employees**: Can only see their own salary after re-encryption
- **Owner**: Can set salaries, approve joins, see aggregate data
- **No one**: Can see individual salaries without authorization

## Contract Interactions

### Setting Employee Salary (Owner)
```solidity
payroll.setSalary(employeeAddress, encryptedSalaryBytes);
```

### Employee Viewing Salary
```solidity
// Frontend generates keypair, sends publicKey to contract
payroll.getMySalary(employeeAddress, publicKey);
// Returns re-encrypted salary that only employee can decrypt
```

### Processing Voting
```solidity
// Owner records encrypted vote
payroll.castVoteFor(voterAddress, candidateAddress);

// After voting ends, distribute bonuses
payroll.distributeBonuses(encryptedVoteThreshold);
```

## Networks

| Network | RPC URL | Explorer |
|---------|---------|----------|
| Zama Devnet | https://devnet.fheoma.zama.xyz | devnet.fheoma.zama.xyz |
| Zama Testnet (Sepolia) | https://sepolia.fheoma.zama.xyz | sepolia.fheoma.zama.xyz |
| Zama Mainnet | https://mainnet.fheoma.zama.xyz | mainnet.fheoma.zama.xyz |

## Security Considerations

1. **Re-encryption**: Users must prove ownership of their private key
2. **Threshold FHE**: For production, consider threshold FHE for withdrawal authorization
3. **Relayer**: A relayer service is needed to handle FHE-to-cleartext bridge in production

## License

BSD-3-Clause-Clear - See Zama's license for TFHE library usage