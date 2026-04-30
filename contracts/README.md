# PriviPay Smart Contracts

Confidential payroll contracts using Zama's fhEVM (Fully Homomorphic Encryption on Ethereum)

## Deployment Details

| Network | Contract Address | Organization ID |
|---------|------------------|-----------------|
| Ethereum Sepolia | `0x24b659223f912bf3Ea273974E2966bde1B11ef02` | `0xd9583fc286b8ab0381eadcf747c20176d893cc3234d976919f16500979da8174` |

**Deployer Wallet**: `0xa21eE72d07D7f8B3A57a12323703cefAE6000D2c`

## Architecture

```
contracts/
├── src/
│   ├── ConfidentialPayroll.sol # Main FHE payroll contract
│   └── interfaces/
│       └── IFHE.sol # TFHE interface
├── script/
│   └── Deploy.s.sol # Deployment script
├── lib/
│   ├── forge-std/ # Foundry standard library
│   └── (Zama fhEVM libraries)
└── test/
    └── ConfidentialPayroll.t.sol # Test contract
```

## Prerequisites

1. **Install Foundry**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install dependencies**
   ```bash
   npm install
   forge install foundry-rs/forge-std
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

## Compile Contracts

```bash
cd contracts
forge build
```

## Run Tests

```bash
forge test
```

## Deploy

### Deploy to Ethereum Sepolia

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url https://ethereum-sepolia-rpc.publicnode.com --broadcast --legacy
```

### Deploy to Zama Testnet

When Zama's RPC is available:

```bash
forge script script/Deploy.s.sol --rpc-url https://sepolia.fheoma.zama.xyz --broadcast
```

### Deploy to Mainnet

```bash
forge script script/Deploy.s.sol --rpc-url https://mainnet.fheoma.zama.xyz --broadcast --verify
```

## Networks

| Network | RPC URL | Explorer |
|---------|---------|----------|
| Ethereum Sepolia | https://ethereum-sepolia-rpc.publicnode.com | sepolia.etherscan.io |
| Zama Devnet | https://devnet.fheoma.zama.xyz | devnet.fheoma.zama.xyz |
| Zama Testnet (Sepolia) | https://sepolia.fheoma.zama.xyz | sepolia.fheoma.zama.xyz |
| Zama Mainnet | https://mainnet.fheoma.zama.xyz | mainnet.fheoma.zama.xyz |

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

## Security Considerations

1. **Re-encryption**: Users must prove ownership of their private key
2. **Threshold FHE**: For production, consider threshold FHE for withdrawal authorization
3. **Relayer**: A relayer service is needed to handle FHE-to-cleartext bridge in production

## License

BSD-3-Clause-Clear - See Zama's license for TFHE library usage