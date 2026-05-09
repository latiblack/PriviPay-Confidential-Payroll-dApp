import { Shield, Lock, Users, ArrowRight, Zap, TrendingUp, DollarSign, CheckCircle2, Swords, UserX, Globe, EyeOff, Fingerprint, Wallet } from "lucide-react";
import Logo from "../components/Logo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useWalletAuth } from "@/hooks/useWalletAuth";

const Landing = () => {
  const { isAuthenticated } = useWalletAuth();

  const problems = [
    { icon: Swords, title: "Internal Conflict", desc: "Visible pay differences breed resentment. When everyone can see what everyone else makes, teams fracture." },
    { icon: UserX, title: "Competitor Exploitation", desc: "Public salary data is a goldmine for competitors. They can map your entire team cost structure from a block explorer." },
    { icon: Globe, title: "Lost Negotiation Power", desc: "Candidates see your current salaries before making an ask. You negotiate from a public baseline, not from strength." },
    { icon: Shield, title: "Personal Safety Risk", desc: "Public salaries make employees targets for phishing, social engineering, and real-world targeting." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={28} alt="PriviPay" />
            <span className="text-lg font-semibold tracking-tight">PriviPay</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Why</a>
            <a href="#solution" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How</a>
            <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium mb-8">
              <Zap className="h-3.5 w-3.5" /> Confidential on-chain payroll
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Pay your team on-chain.
              <br />
              <span className="text-primary">Keep salaries private.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              PriviPay encrypts every salary and bonus before it touches the blockchain. No public pay data, no leaked spreadsheets, no competitor intelligence.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gap-2 px-8 h-12 text-base">Launch App <ArrowRight className="h-5 w-5" /></Button>
              </Link>
              <a href="#problem">
                <Button size="lg" variant="outline" className="px-8 h-12 text-base">Learn More</Button>
              </a>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative mt-20 max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[10px] text-muted-foreground font-mono">privipay/dashboard</span>
                </div>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-muted/40 border p-4"><DollarSign className="h-4 w-4 text-primary mb-2" /><p className="text-xl font-bold">$847,290</p><p className="text-[10px] text-muted-foreground">Total Payroll · <TrendingUp className="h-3 w-3 text-emerald-500 inline" /> +12.5%</p></div>
                <div className="rounded-xl bg-muted/40 border p-4"><Users className="h-4 w-4 text-primary mb-2" /><p className="text-xl font-bold">1,247</p><p className="text-[10px] text-muted-foreground">Employees · <CheckCircle2 className="h-3 w-3 text-emerald-500 inline" /> All encrypted</p></div>
                <div className="rounded-xl bg-muted/40 border p-4"><Shield className="h-4 w-4 text-primary mb-2" /><p className="text-xl font-bold">100%</p><p className="text-[10px] text-muted-foreground">FHE Protected · <Lock className="h-3 w-3 text-primary inline" /> euint64</p></div>
                <div className="col-span-3 rounded-xl bg-muted/30 border p-4 h-28 flex items-end gap-1.5">
                  {[40, 55, 35, 65, 50, 75, 60, 80, 70, 90, 85, 95].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Why payroll must be private</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">Public salary data doesn't just violate privacy — it creates real operational damage.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {problems.map((p) => (
              <div key={p.title} className="flex gap-4 p-6 rounded-xl border bg-card hover:border-primary/20 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">How PriviPay solves it</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">Fully Homomorphic Encryption keeps data encrypted end-to-end.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Encrypt", icon: Lock, desc: "Salaries and bonuses are encrypted in the browser using Zama's FHE SDK before touching the chain. Raw numbers never leave your machine." },
              { step: "02", title: "Compute", icon: Shield, desc: "The contract processes payroll entirely on encrypted data using FHE arithmetic — adding salaries, accumulating balances — without ever decrypting." },
              { step: "03", title: "Withdraw", icon: Wallet, desc: "Employees decrypt only their own balance with their wallet, then withdraw ETH. No admin panel, no HR spreadsheet, no exposed data." },
            ].map((s) => (
              <div key={s.step} className="p-6 rounded-xl border bg-card">
                <div className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold mb-4">{s.step}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Built different</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">No database. No backend. Just a smart contract and a browser.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              { icon: Lock, title: "End-to-end encrypted", desc: "Every salary and bonus is encrypted client-side via FHE before writing on-chain. No plaintext anywhere." },
              { icon: EyeOff, title: "No admin visibility", desc: "Even the contract owner cannot read employee salaries. Only the employee can decrypt their own balance." },
              { icon: Fingerprint, title: "Wallet-gated decryption", desc: "Decryption requires the employee's wallet signature via EIP-712. No credentials, no passwords." },
              { icon: Globe, title: "Zero infrastructure", desc: "No servers, no databases, no API keys. Deploy the contract, share the address, run payroll." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-xl border bg-card hover:border-primary/20 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-primary p-12 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">Ready to protect your payroll?</h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8 text-lg">Deploy a contract, add your team, and run payroll — all on-chain, all encrypted.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="gap-2 px-8 h-12 text-base font-semibold">Get Started <ArrowRight className="h-5 w-5" /></Button>
              </Link>
              <a href="/docs">
                <Button size="lg" variant="ghost" className="px-8 h-12 text-base text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10">Read Docs</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Logo size={24} alt="PriviPay" />
              <span className="font-semibold">PriviPay</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#problem" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Why</a>
              <a href="#solution" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How</a>
              <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
            </div>
            <p className="text-sm text-muted-foreground">Powered by Zama FHE</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
