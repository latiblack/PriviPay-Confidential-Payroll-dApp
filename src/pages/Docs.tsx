import { Shield, Lock, Eye, Users, ArrowRight, Database, Network, FileText, Key, ChevronDown, Wallet, DollarSign, UserPlus, Coins, ExternalLink, BarChart3, CheckCircle2, Layers, Globe, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";

const Section = ({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) => (
  <section id={id} className="py-12 border-b border-border/30 last:border-b-0">
    <h2 className="text-2xl font-bold mb-6">{title}</h2>
    <div className="text-muted-foreground text-lg leading-relaxed space-y-4">{children}</div>
  </section>
);

const SubSection = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
    {description && <p className="text-base text-muted-foreground">{description}</p>}
    <div className="space-y-2">{children}</div>
  </div>
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

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ${className || ""}`}>
    {children}
  </span>
);

const Divider = () => <div className="w-full h-px bg-border/50 my-6" />;

const Docs = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold text-foreground tracking-tight">PriviPay</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#overview" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Overview</a>
            <a href="#architecture" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Architecture</a>
            <a href="#flow" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">App Flow</a>
            <a href="#contract" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Contract</a>
            <Link to="/auth">
              <Button size="sm" className="gap-2 rounded-lg px-5">
                Launch App <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/6 via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/4 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <FileText className="h-4 w-4" />
              Technical Documentation
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Payroll Privacy Through{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Fully Homomorphic Encryption</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              PriviPay brings confidentiality to on-chain payroll. Organizations process salaries,
              compute bonuses, and distribute payouts on the blockchain — while keeping every employee's
              compensation encrypted end-to-end. Auditors get the proof they need without seeing the data
              they shouldn't.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-8 sm:p-12">
          
          {/* 1. Overview */}
          <Section id="overview" title="1. Overview">
            <div>
              <p>
                Blockchain technology delivers immutability, verifiability, and auditability — but
                with a fundamental trade-off: <strong>all data is transparent by default.</strong> Every
                transaction, balance, and state change is visible to anyone with a block explorer.
                For payroll systems serving regulated businesses or crypto-native DAOs, this
                transparency creates an impossible tension: financial audit trails require on-chain
                proof, but employee compensation is among the most sensitive data an organization holds.
              </p>
              <p>
                <strong>PriviPay</strong> resolves this tension using{" "}
                <strong>Fully Homomorphic Encryption (FHE)</strong> powered by Zama's fhEVM protocol.
                Salaries, bonuses, and individual balances are stored and computed entirely as
                encrypted ciphertexts on the Sepolia blockchain — the smart contract never sees a
                plaintext number. Yet payroll math (addition, accumulation, comparison) executes
                correctly inside the encrypted domain, and designated parties (owners, employees,
                auditors) receive cryptographically bounded views of precisely the data they need.
              </p>
            </div>

            <Card className="bg-primary/5 border-primary/10 mt-4">
              <CardContent className="p-6">
                <p className="text-base font-medium text-foreground mb-2">
                  Designed for crypto-native companies.
                </p>
                <p className="text-sm text-muted-foreground">
                  Whether you run a DeFi protocol distributing contributor grants, a DAO compensating
                  core teams, or a Web3 startup with a global workforce — PriviPay gives you on-chain
                  payroll with auditor-ready compliance and zero plaintext exposure. No employee
                  ever sees another employee's salary, even though every transaction is verifiable
                  on-chain.
                </p>
              </CardContent>
            </Card>
          </Section>

          {/* 2. Architecture */}
          <Section id="architecture" title="2. Architecture">
            <SubSection title="Off-Chain Layer" description="Everything the user interacts with.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" /> Supabase (PostgreSQL)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Stores organization metadata, user profiles, role assignments, employee records,
                    bonus logs, payment history, and notifications. Row-Level Security (RLS) ensures
                    each user sees only their authorized data. The database holds <em>references</em> to
                    on-chain state — actual balances live exclusively on-chain as ciphertexts.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" /> React Frontend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Built with React, TypeScript, Vite, Tailwind CSS, shadcn/ui. Wallet authentication
                    via RainbowKit + Wagmi. The frontend orchestrates FHE encryption (Zama relayer SDK),
                    contract interactions (viem), and database operations (Supabase client). It never
                    holds plaintext salary data in any persistent store.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" /> Wallet & Chain
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Users connect via MetaMask / WalletConnect. The app operates on Sepolia testnet
                    with Zama's fhEVM protocol enabled. Contract deployment, employee registration,
                    payroll processing, and withdrawals are all signed transactions from the
                    organization owner's wallet.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" /> Zama FHE Relayer SDK
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Runs in-browser via WebAssembly. Handles TFHE key generation, input encryption,
                    ZK-proof generation for ciphertext correctness, and decryption via the KMS
                    relayer. All FHE operations happen client-side — no plaintext leaves the user's
                    browser until the user explicitly authorizes a decryption request.
                  </CardContent>
                </Card>
              </div>
            </SubSection>

            <Divider />

            <SubSection title="On-Chain Layer" description="The smart contract and FHE infrastructure.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" /> ConfidentialPayroll.sol
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    A Solidity smart contract deployed on Sepolia via the Zama fhEVM compiler.
                    Uses <code>euint64</code> (encrypted 64-bit unsigned integer) for all sensitive
                    data. Supports <code>addEmployee</code>, <code>setSalary</code>,{" "}
                    <code>setBonus</code>, <code>processPayroll</code>, and <code>withdraw</code>.
                    One contract instance per organization — isolation by design.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" /> FHE Infrastructure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Zama's ACL (Access Control List) contract manages per-ciphertext access grants,
                    the KMS contract handles threshold decryption, and input verifier contracts
                    validate ZK-proofs for every encrypted input. The relayer bridges browser-side
                    FHE computation to on-chain proof verification and decryption.
                  </CardContent>
                </Card>
              </div>
            </SubSection>

            <Divider />

            <SubSection title="Data Flow Summary" description="How a salary travels from the owner's browser to on-chain ciphertext to decrypted view.">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge>1</Badge>
                  <p className="text-base">
                    <strong>Encrypt (Client-side):</strong> The owner enters a salary amount. The Zama FHE SDK
                    generates a TFHE keypair, encrypts the value as an <code>euint64</code>, produces
                    a ZK-proof attesting to correct encryption, and sends both to the relayer.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge>2</Badge>
                  <p className="text-base">
                    <strong>Submit (On-chain):</strong> The relayer verifies the proof and returns an
                    input-proof. The owner's wallet sends a transaction calling{" "}
                    <code>setSalary(employee, encryptedHandle, inputProof)</code> on the{" "}
                    <code>ConfidentialPayroll</code> contract. The ciphertext is stored in the contract's
                    encrypted state — only the corresponding <code>euint64</code> handle is visible on-chain.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge>3</Badge>
                  <p className="text-base">
                    <strong>Compute (Encrypted Domain):</strong> When the owner calls{" "}
                    <code>processPayroll()</code>, the contract adds salary + bonus ciphers for each
                    employee using FHE addition (<code>FHE.add</code>). The result stays encrypted —
                    the contract logic operates on ciphertexts, never decrypting.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge>4</Badge>
                  <p className="text-base">
                    <strong>Decrypt (Authorized Access):</strong> An employee calls{" "}
                    <code>getBalance(employee)</code> to read their encrypted balance handle. They then
                    request decryption via the Zama KMS, which requires a signed EIP-712 authorization.
                    The KMS threshold-decrypts the handle and returns the plaintext balance to that
                    employee alone. Auditors can receive time-bounded decryption grants without seeing
                    raw salary figures.
                  </p>
                </div>
              </div>
            </SubSection>
          </Section>

          {/* 3. Why Zama */}
          <Section id="zama" title="3. Why Zama? Privacy for Transparent Systems">
            <div>
              <p>
                Traditional blockchains are transparent by design — every state variable is public.
                This transparency is a feature for financial audit trails, but a liability for payroll
                data. Encrypting data off-chain and storing only hashes on-chain sacrifices
                composability and verifiability. Zama's fhEVM takes a different approach: it allows
                smart contracts to <strong>compute on encrypted data directly on-chain</strong>.
              </p>
              <p>
                <strong>How FHE (TFHE) works in PriviPay:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <strong>Confidentiality on a public ledger:</strong> All salary, bonus, and balance
                  data exists on Sepolia as encrypted <code>euint64</code> values. Nobody — not even
                  validators or RPC providers — can read the plaintext.
                </li>
                <li>
                  <strong>Computation without decryption:</strong> The contract runs arithmetic
                  (add, subtract, compare) on encrypted inputs. Payroll accumulation, bonus addition,
                  and withdrawal authorization all execute inside the encrypted domain.
                </li>
                <li>
                  <strong>Selective disclosure:</strong> Access control is managed on-chain via ACL
                  grants. An owner can authorize an auditor to decrypt aggregate payroll totals
                  without revealing individual salaries. This makes PriviPay uniquely suited for
                  regulated environments where compliance officers need proof — not full data access.
                </li>
                <li>
                  <strong>No trusted setup:</strong> TFHE does not require a multi-party trusted
                  ceremony. Keys are generated client-side, and the KMS threshold decryption ensures
                  no single party can unilaterally decrypt.
                </li>
                <li>
                  <strong>Balance: transparency + privacy + compliance.</strong> Zama bridges the gap
                  between crypto-native transparency and enterprise privacy requirements. PriviPay
                  leverages this to provide verifiable on-chain payroll with legally sound audit trails.
                </li>
              </ul>
            </div>
          </Section>

          {/* 4. Compliance */}
          <Section id="compliance" title="4. Compliance & Auditor Access">
            <div>
              <p>
                PriviPay is built for regulated crypto companies and DAOs that must satisfy both
                blockchain transparency standards and data-protection regulations (GDPR, CCPA).
                The core insight: <strong>provability without visibility.</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Auditor-Ready
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Auditors receive time-bounded, scope-limited decryption grants. They can verify
                  that total payroll matches declared amounts, that all employees are properly
                  compensated, and that no unauthorized withdrawals occurred — without ever seeing
                  individual salary figures.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-500" />
                    GDPR / CCPA
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Employee compensation data is encrypted at rest (on-chain ciphertexts) and in
                  transit (FHE inputs). The database stores no plaintext salary values — only
                  encrypted references. Data subject access requests can be fulfilled by issuing
                  a decryption grant to the requesting employee, who decrypts their own data.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    Exportable Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Payment history, bonus records, and payroll processing events are timestamped
                  on-chain and mirrored to Supabase. Auditor dashboards can export CSV reports
                  with aggregated totals and per-pay-period breakdowns, with optional proof
                  references to Sepolia transaction hashes.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    Isolation by Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Each organization deploys its own <code>ConfidentialPayroll</code> contract.
                  Data from Company A cannot be read by Company B — even though both contracts
                  run on the same chain. RLS in the database mirrors this isolation.
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* 5. App Flow */}
          <Section id="flow" title="5. App Flow — From Zero to Payroll">
            <div className="space-y-8">
              <Step num={1} title="Create Organization & Deploy Contract">
                <p>
                  An owner connects their wallet and creates an organization on the Auth page.
                  During creation, PriviPay compiles and deploys a fresh{" "}
                  <code>ConfidentialPayroll</code> contract to Sepolia using Zama's fhEVM
                  infrastructure. The contract address is recorded in Supabase for the organization,
                  and the deployer wallet is set as the contract <code>owner</code>. One org = one
                  contract — complete data isolation.
                </p>
              </Step>
              <Step num={2} title="Invite & Add Employees">
                <p>
                  The owner invites team members via wallet address. Invitations can be sent
                  directly or shared as a link. Accepted invites place users in a pending state
                  until the owner approves. Once approved, the employee appears in the{" "}
                  <strong>Employees</strong> panel. The owner then adds them to payroll: provides
                  a monthly salary amount (in USD), and the app encrypts it via the Zama FHE SDK
                  and writes it on-chain via <code>setSalary()</code>. The employee is also
                  registered on-chain via <code>addEmployee()</code>, which initializes their
                  zero-balance encrypted slot.
                </p>
              </Step>
              <Step num={3} title="Manage Bonuses">
                <p>
                  On the <strong>Bonus</strong> page, the owner (or an authorized manager) can add
                  bonuses for any active employee. As of v1, bonuses are encrypted and set on-chain
                  via <code>setBonus()</code> <em>before</em> being recorded in the database —
                  ensuring on-chain state is always the source of truth. Managers can submit bonus
                  requests that the owner approves or rejects. Each bonus has a month label for
                  audit tracking.
                </p>
              </Step>
              <Step num={4} title="Fund the Contract & Process Payroll">
                <p>
                  On the <strong>Payments</strong> page, the owner initiates a payroll cycle. The
                  app automatically calculates the total payroll obligation (sum of all salaries +
                  bonuses) and pre-fills the required ETH deposit amount using the current ETH/USD
                  price from CoinGecko. The owner can adjust the amount, then clicks{" "}
                  <strong>"Deposit & Process Payroll"</strong>:
                </p>
                <ul className="list-disc pl-6 space-y-1 -mt-1">
                  <li>
                    <strong>Step A — Deposit:</strong> ETH is sent to the contract's fund pool via{" "}
                    <code>depositFunds()</code>.
                  </li>
                  <li>
                    <strong>Step B — Process:</strong> The contract iterates all employees, adding
                    each employee's encrypted salary + encrypted bonus to their encrypted balance
                    using FHE arithmetic. Bonuses are reset to zero after processing.
                  </li>
                  <li>
                    Payment records are stored in Supabase with the on-chain transaction hash for
                    auditability.
                  </li>
                </ul>
              </Step>
              <Step num={5} title="Employee Withdraws">
                <p>
                  Employees visit their <strong>My Dashboard</strong> page where they can see their
                  encrypted balance (FHE-protected) and choose to decrypt it via a signed EIP-712
                  authorization. On the <strong>Payments</strong> page, an employee can withdraw
                  funds: they specify an ETH amount, the contract verifies that their encrypted
                  balance is sufficient (using FHE comparison), deducts it (encrypted subtraction),
                  and transfers ETH from the contract's fund pool. Every withdrawal emits an event
                  with the amount and is recorded in the database.
                </p>
              </Step>
              <Step num={6} title="Auditor Access & Reporting">
                <p>
                  Auditors can be invited to an organization with a scoped role. Through the
                  <strong> Auditor Dashboard</strong>, they view aggregated payroll data, payment
                  history, and bonus records — all with on-chain proof. The owner can issue
                  time-bounded decryption grants via the ACL contract so auditors can verify
                  totals without accessing individual salaries. Exportable CSV reports include
                  Sepolia transaction hashes for independent verification.
                </p>
              </Step>
            </div>
          </Section>

          {/* 6. Contract Reference */}
          <Section id="contract" title="6. Smart Contract Reference">
            <SubSection title="ConfidentialPayroll.sol" description="Deployed on Sepolia with Zama fhEVM compiler.">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-semibold">Function</th>
                      <th className="text-left py-2 pr-4 font-semibold">Access</th>
                      <th className="text-left py-2 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">constructor()</td>
                      <td className="py-2 pr-4"><Badge>deploy</Badge></td>
                      <td className="py-2 text-muted-foreground">Sets deployer as contract owner</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">depositFunds()</td>
                      <td className="py-2 pr-4"><Badge>onlyOwner</Badge></td>
                      <td className="py-2 text-muted-foreground">Adds ETH to the fund pool (payable)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">addEmployee(address)</td>
                      <td className="py-2 pr-4"><Badge>onlyOwner</Badge></td>
                      <td className="py-2 text-muted-foreground">Registers employee, initializes encrypted slots to zero</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">setSalary(address, bytes32, bytes)</td>
                      <td className="py-2 pr-4"><Badge>onlyOwner</Badge></td>
                      <td className="py-2 text-muted-foreground">Sets encrypted monthly salary for an employee</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">setBonus(address, bytes32, bytes)</td>
                      <td className="py-2 pr-4"><Badge>onlyOwner</Badge></td>
                      <td className="py-2 text-muted-foreground">Sets encrypted bonus for an employee</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">processPayroll()</td>
                      <td className="py-2 pr-4"><Badge>onlyOwner</Badge></td>
                      <td className="py-2 text-muted-foreground">Adds salary + bonus to each employee's encrypted balance; resets bonus to zero</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">withdraw(uint64)</td>
                      <td className="py-2 pr-4"><Badge>onlyEmployee</Badge></td>
                      <td className="py-2 text-muted-foreground">Withdraws ETH from fund pool if encrypted balance is sufficient</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">getBalance(address)</td>
                      <td className="py-2 pr-4"><Badge>view</Badge></td>
                      <td className="py-2 text-muted-foreground">Returns encrypted balance handle for an employee</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">getSalary(address)</td>
                      <td className="py-2 pr-4"><Badge>view</Badge></td>
                      <td className="py-2 text-muted-foreground">Returns encrypted salary handle</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">getBonus(address)</td>
                      <td className="py-2 pr-4"><Badge>view</Badge></td>
                      <td className="py-2 text-muted-foreground">Returns encrypted bonus handle</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </SubSection>

            <Divider />

            <SubSection title="Encryption Types">
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm">euint64</code> — Encrypted
                  64-bit unsigned integer. Used for all confidential values (salary, bonus, balance).
                  Stored as <code className="bg-muted px-1.5 py-0.5 rounded text-sm">bytes32</code> handles
                  on-chain. Operations: add, sub, le (less-or-equal), select.
                </li>
                <li>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm">externalEuint64</code> —
                  Wrapper type for submitting encrypted inputs from off-chain. Requires an
                  accompanying <code className="bg-muted px-1.5 py-0.5 rounded text-sm">inputProof</code>{" "}
                  (ZK-proof) to prevent malicious inputs.
                </li>
                <li>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm">ebool</code> — Encrypted
                  boolean. Used internally for comparison results and conditional logic.
                </li>
              </ul>
            </SubSection>
          </Section>

          {/* 7. FAQ */}
          <Section id="faq" title="7. FAQ">
            <div className="space-y-3">
              {[
                {
                  q: "Why not just store salaries in a private database?",
                  a: "A private database can't provide cryptographic proof to auditors. With PriviPay, every salary transaction is on-chain and verifiable — but the data itself is encrypted so only authorized parties can decrypt their own slice. You get the best of both worlds: on-chain audit trails with off-chain privacy.",
                },
                {
                  q: "What blockchain does PriviPay use?",
                  a: "Sepolia testnet with Zama's fhEVM protocol enabled. The fhEVM adds FHE precompiles to standard EVM, allowing Solidity contracts to operate on encrypted types. Production deployments will migrate to a mainnet fhEVM deployment or a dedicated L2.",
                },
                {
                  q: "How does the encryption work without the contract seeing plaintext?",
                  a: "The Zama FHE SDK encrypts data in the user's browser before sending it on-chain. The contract receives ciphertexts and encrypted ZK-proofs. It verifies the proofs (to prevent garbage inputs) and stores the ciphertexts. All arithmetic happens on ciphertexts using TFHE operations — the contract never decrypts.",
                },
                {
                  q: "Can auditors see individual employee salaries?",
                  a: "Not by default. The owner can issue time-bounded, scope-limited ACL grants that let an auditor decrypt <em>aggregate</em> payroll totals (e.g., 'total Q1 payroll across all employees') without granting access to individual salary handles. This is enforced on-chain by the ACL contract.",
                },
                {
                  q: "What happens if the owner's private key is compromised?",
                  a: "Compromise of the owner key allows an attacker to call owner-only functions (e.g., setSalary, processPayroll, depositFunds). However, they cannot decrypt existing ciphertexts — decryption requires the KMS threshold signature, which is held by Zama's network of KMS signers. The attacker can steal deposited ETH from the fund pool but cannot read historical salary data.",
                },
                {
                  q: "Is this production-ready?",
                  a: "PriviPay v1 runs on Sepolia testnet as a proof-of-concept. The Zama fhEVM protocol is under active development. Gas costs for FHE operations are higher than regular EVM operations. Before mainnet deployment, the contract should undergo a formal security audit and the fhEVM should reach production stability.",
                },
              ].map((faq, i) => (
                <div key={i} className="border border-border/50 rounded-lg">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <span className="font-medium text-foreground">{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedFaq === i && (
                    <div className="px-4 pb-4 text-muted-foreground">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold text-foreground">PriviPay</span>
            <span className="text-xs text-muted-foreground ml-2">Documentation v1.0</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/zama-ai/fhevm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-4 w-4" /> Zama fhEVM
            </a>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Launch App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Docs;
