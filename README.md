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

# 3. Configure
cp .env.example .env
# Edit .env with your WalletConnect project ID and Infura/Alchemy RPC URL
# Optional: add VITE_CONTRACT_ADDRESS if you already have a deployed contract

# 4. Run
npm run dev
# Open http://localhost:8080
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description | Required |
|---|---|---|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com) | Yes |
| `VITE_SEPOLIA_RPC` | Sepolia RPC URL from [Infura](https://infura.io) or [Alchemy](https://alchemy.com) | Yes |
| `VITE_CONTRACT_ADDRESS` | Pre-deployed contract address (optional — can also deploy via app) | No |
| `VITE_RELAYER_URL` | Zama relayer URL (default: testnet relayer) | No |
| `VITE_ETHERSCAN_API_KEY` | Etherscan API key for contract verification | No |

## How to Use

You have three options for setting up the payroll contract:

### Option 1: Deploy inside the app (easiest)

1. Connect your wallet, click **"Create New Payroll"**, enter a name, and confirm the transaction. The contract is deployed from your browser — no CLI needed.
2. The app saves the contract address locally. You'll go straight to the dashboard.

### Option 2: Deploy with Hardhat, add to .env

1. Deploy the contract manually from `fhevm-hardhat/`:
   ```bash
   cd fhevm-hardhat
   cp .env.example .env   # add your private key and RPC URL
   npm install
   npx hardhat compile
   npx hardhat run scripts/deploy.ts --network sepolia
   ```
2. Copy the deployed address into your root `.env`:
   ```env
   VITE_CONTRACT_ADDRESS="0x_your_deployed_contract"
   ```
3. Run `npm run dev` — the app picks up the address automatically.

### Option 3: Deploy with Hardhat, import in-app

1. Deploy via Hardhat (same as Option 2, steps 1-2).
2. Instead of setting `VITE_CONTRACT_ADDRESS`, open the app, connect your wallet, and click **"Use Existing Contract"** — paste the address.
3. The app stores it locally.

### As an Owner

1. **Connect your wallet** — click "Connect Wallet" on the landing page.
2. **Create a new payroll** — give it a name, deploy the ConfidentialPayroll contract. You'll pay a small gas fee (Sepolia ETH).
3. **Add employees** — paste their wallet addresses and set monthly salaries. The salary is encrypted client-side and stored on-chain.
4. **Set bonuses** — navigate to Bonuses, select an employee, enter a bonus amount.
5. **Process payroll** — deposit ETH into the contract pool, then run the payroll. The contract adds salary + bonus to each employee's encrypted balance.
6. Employees can now withdraw.

### As an Employee

1. **Connect your wallet**
2. **Use existing contract** — paste the contract address your employer gave you.
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
