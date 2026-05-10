# PriviPay - Confidential Payroll dApp

Confidential on-chain payroll powered by Zama's Fully Homomorphic Encryption.

## What it does

PriviPay lets organizations process payroll on the blockchain while keeping every employee's salary and bonus encrypted. Nobody — not even validators — can see the plaintext.

- **Owner**: Deploy a payroll contract, add employees with encrypted salaries, set bonuses, deposit ETH, and process payroll.
- **Employee**: View and decrypt your encrypted salary, bonus, and balance with your wallet, then withdraw funds in USD.
- **Contract is everything**: There is no database. All data lives on-chain in the ConfidentialPayroll contract.

## Architecture

```
Browser (React + Vite + Tailwind)
    ├── Zama FHE SDK (client-side encryption/decryption)
    ├── Viem + Wagmi + RainbowKit (wallet & chain interaction)
    └── Sepolia (ConfidentialPayroll.sol — fhEVM contract)
```

**No backend. No database. Pure on-chain.**

## Prerequisites

- Node.js 18+
- A browser wallet (MetaMask, Rainbow, etc.)
- Sepolia ETH (get from [sepoliafaucet.com](https://sepoliafaucet.com))

## Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/privipay.git
cd privipay

# 2. Install
npm install

# 3. Deploy the contract
cd fhevm-hardhat
cp .env.example .env   # add your private key and Sepolia RPC URL
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
# Copy the deployed contract address from the output

# 4. Configure the app
cd ..
cp .env.example .env
# Fill in your WalletConnect project ID, Sepolia RPC URL, and the deployed contract address

# 5. Run
npm run dev
# Open http://localhost:8080 — connects and goes straight to the dashboard
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description | Required |
|---|---|---|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com) | Yes |
| `VITE_SEPOLIA_RPC` | Sepolia RPC URL from [Infura](https://infura.io) or [Alchemy](https://alchemy.com) | Yes |
| `VITE_CONTRACT_ADDRESS` | Deployed ConfidentialPayroll contract address | Yes |
| `VITE_RELAYER_URL` | Zama relayer URL (default: testnet relayer) | No |

## How to Use

### Owner

1. **Deploy & configure** — follow Quick Start above.
2. **Connect wallet** — opens the Dashboard with contract overview, employee roster, and payroll history.
3. **Add employees** (Treasury page) — paste wallet addresses and set monthly salaries. Both `addEmployee` and `setSalary` are called and confirmed on-chain before continuing.
4. **Set bonuses** (Bonuses page) — select an employee, enter a USD bonus. Only employees with bonuses appear in the list.
5. **Calculate total** (Treasury page) — click "Calculate" to compute the on-chain FHE sum of all salaries + bonuses, decrypted and shown in USD. Auto-fills the ETH deposit amount.
6. **Process payroll** — deposit ETH into the contract pool, then run payroll. The contract adds salary + bonus to each employee's encrypted balance.
7. **Decrypt any value** — click Salary ▸, Bonus ▸, or Balance ▸ on any employee row to decrypt and see the actual on-chain value.

### Employee

1. **Connect wallet** — opens your Dashboard with Wallet, Salary, and Balance cards.
2. **Decrypt** — click "Decrypt" on any card to see your salary, bonus, or accumulated balance. Requires a wallet signature.
3. **Withdraw** (Treasury page) — enter a USD amount. The app converts to cents for FHE balance check and ETH for the transfer. Only withdraws up to your balance.
4. **View history** — Dashboard shows your withdrawal history from on-chain events.

## Contract Reference

The `ConfidentialPayroll.sol` contract ([source](fhevm-hardhat/contracts/ConfidentialPayroll.sol)):

| Function | Access | Description |
|---|---|---|
| `depositFunds()` | onlyOwner | Adds ETH to fund pool (payable) |
| `addEmployee(address)` | onlyOwner | Registers employee, initializes encrypted slots to zero |
| `setSalary(address,bytes32,bytes)` | onlyOwner | Sets encrypted monthly salary |
| `setBonus(address,bytes32,bytes)` | onlyOwner | Sets encrypted bonus |
| `updateTotalCompensation()` | onlyOwner | Computes FHE sum of all salaries + bonuses, stores with ACL |
| `totalCompensation()` | view | Returns the stored total compensation handle |
| `processPayroll()` | onlyOwner | Adds salary + bonus to each employee's encrypted balance |
| `withdraw(uint64,uint64)` | onlyEmployee | Deducts from balance (cents), transfers ETH (wei) |
| `getSalary(address)` | view | Returns encrypted salary handle |
| `getBonus(address)` | view | Returns encrypted bonus handle |
| `getBalance(address)` | view | Returns encrypted balance handle |

All sensitive data stored as FHE `euint64` ciphertexts. Decryption requires wallet signature + Zama KMS.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Wallet**: Wagmi, RainbowKit, Viem
- **FHE**: Zama fhEVM Protocol, fhevm relayer SDK v0.4.2
- **Chain**: Sepolia testnet

## License

BSD-3-Clause-Clear
