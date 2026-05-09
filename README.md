# PriviPay

Confidential on-chain payroll powered by Zama's Fully Homomorphic Encryption.

## What it does

PriviPay lets organizations process payroll on the blockchain while keeping every employee's salary and bonus encrypted. Nobody — not even validators — can see the plaintext.

- **Owner**: Deploy a payroll contract, add employees with encrypted salaries, set bonuses, deposit ETH, and process payroll.
- **Employee**: View your encrypted balance, decrypt it with your wallet, and withdraw funds.
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

### As an Owner

1. **Set up the contract** — follow Quick Start above to deploy and configure.
2. **Connect your wallet** — open the app, connect. You'll go straight to the Treasury dashboard.
3. **Add employees** — paste their wallet addresses and set monthly salaries. The salary is encrypted client-side and stored on-chain.
4. **Set bonuses** — navigate to Bonuses, select an employee, enter a bonus amount.
5. **Process payroll** — deposit ETH into the contract pool, then run the payroll. The contract adds salary + bonus to each employee's encrypted balance.
6. Employees can now withdraw.

### As an Employee

1. **Ask your employer for the app URL** and the contract address (they configure it).
2. **Connect your wallet** — you'll go to your dashboard.
3. **Dashboard** — click "Decrypt Balance" to see your on-chain balance (requires a wallet signature).
4. **Withdraw** — go to the Withdraw page and pull your earned ETH from the contract.

## Contract Reference

The `ConfidentialPayroll.sol` contract ([source](fhevm-hardhat/contracts/ConfidentialPayroll.sol)):

- `addEmployee(address)` — registers employee
- `setSalary(address, bytes32, bytes)` — sets encrypted salary
- `setBonus(address, bytes32, bytes)` — sets encrypted bonus
- `processPayroll()` — adds salary + bonus to each employee's balance
- `depositFunds()` — deposits ETH into the contract pool (payable)
- `withdraw(uint64)` — withdraws ETH (employee only)
- `getBalance(address)` — returns encrypted balance handle

All sensitive data is stored as FHE `euint64` ciphertexts.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Wallet**: Wagmi, RainbowKit, Viem
- **FHE**: Zama fhEVM Protocol, fhevm relayer SDK
- **Chain**: Sepolia testnet

## License

BSD-3-Clause-Clear
