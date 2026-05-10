import { Shield, Lock, ArrowRight, FileText, ChevronDown, Wallet, DollarSign, Users, ExternalLink, Cpu, Globe, Key, Code } from "lucide-react";
import Logo from "@/components/Logo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Section = ({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) => (
  <section id={id} className="py-12 border-b border-border/30 last:border-b-0">
    <h2 className="text-2xl font-bold mb-6">{title}</h2>
    <div className="text-muted-foreground text-lg leading-relaxed space-y-4">{children}</div>
  </section>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{children}</span>
);

const Step = ({ num, title, children }: { num: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
      <span className="text-primary font-bold">{num}</span>
    </div>
    <div className="space-y-2">
      <h4 className="text-lg font-semibold text-foreground">{title}</h4>
      <div className="text-base text-muted-foreground">{children}</div>
    </div>
  </div>
);

const Docs = () => {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={28} alt="PriviPay" />
            <span className="text-lg font-semibold tracking-tight">PriviPay</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#overview" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Overview</a>
            <a href="#how-it-works" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">How It Works</a>
            <a href="#contract" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Contract</a>
            <a href="#setup" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Setup</a>
            <Link to="/auth"><Button size="sm" className="gap-2 rounded-lg">Launch App <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/6 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <FileText className="h-4 w-4" /> Documentation
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Confidential Payroll with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">FHE</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              PriviPay encrypts every salary and bonus before writing it on-chain. No database, no backend — just a smart contract and a browser.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-8 sm:p-12">

          <Section id="overview" title="1. Overview">
            <p>
              Blockchains are transparent by default — every transaction, every state variable, visible to anyone with a block explorer. That's great for financial audit trails, but terrible for payroll. Employee salaries are among the most sensitive data an organization holds.
            </p>
            <p>
              PriviPay solves this with <strong>Fully Homomorphic Encryption (FHE)</strong> powered by Zama's fhEVM. Salaries, bonuses, and balances are stored as encrypted ciphertexts on Sepolia. The contract processes payroll — adding salaries, accumulating balances — entirely on encrypted data. Nobody, not even validators, can read the plaintext.
            </p>
            <p>
              One contract per organization. No servers, no database, no API keys. Deploy the contract, share the address, run payroll.
            </p>
          </Section>

          <Section id="how-it-works" title="2. How It Works">
            <div className="space-y-8">
              <Step num={1} title="Deploy the contract">
                <p>Using Hardhat, deploy <code>ConfidentialPayroll.sol</code> to Sepolia. The deployer wallet becomes the contract owner. One contract = one payroll instance. Add the deployed address to <code>.env</code>.</p>
              </Step>
              <Step num={2} title="Connect & add employees">
                <p>The owner connects their wallet, the app reads the contract address from <code>.env</code>, verifies ownership, and opens the Treasury dashboard. Add employees by pasting their wallet addresses and setting monthly salaries — encrypted client-side via Zama's FHE SDK before being written on-chain.</p>
              </Step>
              <Step num={3} title="Set bonuses (optional)">
                <p>Navigate to Bonuses, select an employee, enter an amount. The bonus is encrypted and stored on-chain. It gets added to the employee's balance when payroll is processed.</p>
              </Step>
              <Step num={4} title="Fund & process payroll">
                <p>The owner deposits ETH into the contract pool, then runs process payroll. The contract iterates over all employees, adding each one's encrypted salary + bonus to their encrypted balance using FHE arithmetic — all without ever decrypting anything.</p>
              </Step>
              <Step num={5} title="Employee decrypts & withdraws">
                <p>Employees connect their wallet. Their dashboard reads their encrypted balance from the contract. They click "Decrypt Balance" — their wallet signs an EIP-712 authorization, and the Zama KMS threshold-decrypts their balance. They can then withdraw ETH from the contract pool.</p>
              </Step>
            </div>
          </Section>

          <Section id="contract" title="3. Smart Contract">
            <p>The <code>ConfidentialPayroll.sol</code> contract uses Zama's fhEVM compiler. All sensitive data is stored as <code>euint64</code> (encrypted 64-bit unsigned integer).</p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold">Function</th>
                    <th className="text-left py-2 pr-4 font-semibold">Access</th>
                    <th className="text-left py-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  <tr><td className="py-2 pr-4 font-mono text-xs">depositFunds()</td><td className="py-2 pr-4"><Badge>onlyOwner</Badge></td><td className="py-2 text-muted-foreground">Adds ETH to the fund pool (payable)</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">addEmployee(address)</td><td className="py-2 pr-4"><Badge>onlyOwner</Badge></td><td className="py-2 text-muted-foreground">Registers an employee, initializes encrypted salary/balance to zero</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">setSalary(address,bytes32,bytes)</td><td className="py-2 pr-4"><Badge>onlyOwner</Badge></td><td className="py-2 text-muted-foreground">Sets encrypted monthly salary</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">setBonus(address,bytes32,bytes)</td><td className="py-2 pr-4"><Badge>onlyOwner</Badge></td><td className="py-2 text-muted-foreground">Sets encrypted bonus</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">updateTotalCompensation()</td><td className="py-2 pr-4"><Badge>onlyOwner</Badge></td><td className="py-2 text-muted-foreground">FHE-sums all salaries+bonuses, stores result with ACL</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">totalCompensation()</td><td className="py-2 pr-4"><Badge>view</Badge></td><td className="py-2 text-muted-foreground">Returns encrypted total compensation handle</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">processPayroll()</td><td className="py-2 pr-4"><Badge>onlyOwner</Badge></td><td className="py-2 text-muted-foreground">Adds salary + bonus to each employee's encrypted balance</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">withdraw(uint64,uint64)</td><td className="py-2 pr-4"><Badge>onlyEmployee</Badge></td><td className="py-2 text-muted-foreground">Deducts from balanced (cents), transfers ETH (wei)</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">getSalary(address)</td><td className="py-2 pr-4"><Badge>view</Badge></td><td className="py-2 text-muted-foreground">Returns encrypted salary handle</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">getBonus(address)</td><td className="py-2 pr-4"><Badge>view</Badge></td><td className="py-2 text-muted-foreground">Returns encrypted bonus handle</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">getBalance(address)</td><td className="py-2 pr-4"><Badge>view</Badge></td><td className="py-2 text-muted-foreground">Returns encrypted balance handle</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="setup" title="4. Setup & Running">
            <div className="space-y-4">
              <p><strong>Step 1:</strong> Clone the repo and install dependencies.</p>
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">{`git clone https://github.com/YOUR_USERNAME/privipay.git
cd privipay
npm install`}</pre>

              <p><strong>Step 2:</strong> Deploy the contract via Hardhat.</p>
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">{`cd fhevm-hardhat
cp .env.example .env   # add private key + Sepolia RPC
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
# Copy the deployed address`}</pre>

              <p><strong>Step 3:</strong> Configure the app.</p>
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">{`cd ..
cp .env.example .env
# Fill in: VITE_WALLETCONNECT_PROJECT_ID, VITE_SEPOLIA_RPC, VITE_CONTRACT_ADDRESS`}</pre>

              <p><strong>Step 4:</strong> Run.</p>
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">npm run dev</pre>
              <p>Open <code>http://localhost:8080</code>. Connect your wallet — you'll go straight to the dashboard.</p>
            </div>
          </Section>

          <Section id="faq" title="5. FAQ">
            <div className="space-y-3">
              {[
                { q: "How do I add an employee?", a: "Go to Treasury, click Add Employee, paste their wallet address and enter a monthly salary. Both addEmployee() and setSalary() are confirmed on-chain before continuing — the salary is encrypted via Zama's FHE SDK and stored as euint64." },
                { q: "How does decryption work?", a: "Click Salary ▸, Bonus ▸, or Balance ▸ on any employee row. Your wallet signs an EIP-712 authorization, and Zama's KMS threshold-decrypts the euint64 value. Only wallets with ACL permission can decrypt — the owner can decrypt all employees, employees can only decrypt their own data." },
                { q: "How does withdraw work?", a: "Enter a USD amount. The app converts to cents for the FHE balance check (ensuring you can't withdraw more than your balance) and ETH wei for the transfer. Both parameters are sent to the contract." },
                { q: "What does the Calculate button do?", a: "Calls updateTotalCompensation() — an on-chain FHE sum of all salaries + bonuses — then decrypts the result. Shows total payroll in USD and auto-fills the ETH deposit." },
                { q: "Can I see employee salaries?", a: "Only by decrypting them. All salary, bonus, and balance data is stored as encrypted euint64 ciphertexts. The contract processes payroll entirely on encrypted data without ever decrypting." },
              ].map((faq, i) => (
                <div key={i} className="border border-border/50 rounded-lg">
                  <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30">
                    <span className="font-medium">{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expanded === i ? "rotate-180" : ""}`} />
                  </button>
                  {expanded === i && <div className="px-4 pb-4 text-muted-foreground">{faq.a}</div>}
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>

      <footer className="border-t border-border/40 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo size={24} alt="PriviPay" />
            <span className="text-sm font-semibold">PriviPay</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Launch App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Docs;
