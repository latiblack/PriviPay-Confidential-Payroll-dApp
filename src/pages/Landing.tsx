import { Shield, Lock, Eye, Users, ArrowRight, Zap, BarChart3, Globe, ChevronRight, TrendingUp, DollarSign, CheckCircle2 } from "lucide-react";
import Logo from "../components/Logo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuth } from "@/hooks/useAuth";

const DashboardMockup = () => (
  <div className="relative w-full max-w-4xl mx-auto mt-16">
    <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
    
    <div className="relative rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/40">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/50" />
          <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-6 rounded-lg bg-muted max-w-xs mx-auto flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground">app.privipay.io/dashboard</span>
          </div>
        </div>
      </div>
      
      {/* Dashboard content */}
      <div className="p-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Payroll</span>
          </div>
          <p className="text-xl font-bold text-foreground">$847,290</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">+12.5%</span>
          </div>
        </div>
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Employees</span>
          </div>
          <p className="text-xl font-bold text-foreground">1,247</p>
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">All encrypted</span>
          </div>
        </div>
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Security</span>
          </div>
          <p className="text-xl font-bold text-foreground">100%</p>
          <div className="flex items-center gap-1 mt-1">
            <Lock className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">FHE Protected</span>
          </div>
        </div>

        <div className="col-span-2 rounded-xl bg-muted/30 border border-border/40 p-4 h-32">
          <p className="text-xs text-muted-foreground mb-3">Monthly Payroll Distribution</p>
          <div className="flex items-end gap-1.5 h-16">
            {[40, 55, 35, 65, 50, 75, 60, 80, 70, 90, 85, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-primary" style={{ height: `${h}%`, opacity: 0.4 + (h / 100) * 0.6 }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-muted/30 border border-border/40 p-4 h-32">
          <p className="text-xs text-muted-foreground mb-3">Encryption Status</p>
          <div className="relative w-16 h-16 mx-auto mt-2">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" className="stroke-muted" />
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeDasharray="88 88" strokeLinecap="round" className="stroke-primary" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">100%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Landing = () => {
  const { isAuthenticated } = useWalletAuth();
  const features = [
    { icon: Lock, title: "Encrypted Salaries & Bonuses", description: "Compensation is stored as encrypted integers (euint) on-chain. Raw salary and bonus figures are never exposed — not to validators, not to the public." },
    { icon: Eye, title: "Auditor-Ready Transparency", description: "Regulators and auditors get verifiable aggregates, totals and proofs they need for compliance — without ever decrypting an individual employee's pay." },
    { icon: BarChart3, title: "Compliant Computation", description: "Run payroll, tax and reporting computations directly on encrypted data via FHE. Satisfy disclosure requirements while honoring data protection laws." },
  ];

  const stats = [
    { value: "B2B", label: "Built for Crypto Companies" },
    { value: "GDPR", label: "Privacy-Law Aligned" },
    { value: "On-chain", label: "Verifiable Payroll" },
    { value: "0", label: "Plaintext Salaries Exposed" },
  ];

  const steps = [
    { step: "01", title: "Encrypt", desc: "Salaries and bonuses are encrypted client-side before being written on-chain as euint256. Employee pay data leaves your org already protected." },
    { step: "02", title: "Compute", desc: "Smart contracts run payroll, tax and reporting logic directly on encrypted data using FHE — no decryption required to operate." },
    { step: "03", title: "Disclose Selectively", desc: "Auditors and regulators receive the aggregates and proofs they're entitled to. Employees see only their own pay. Access is enforced cryptographically." },
  ];

  const benefits = [
    { icon: Shield, title: "Built for Crypto Companies", desc: "Purpose-built for teams running on-chain payroll who face growing pressure to disclose without exposing employees to risk." },
    { icon: BarChart3, title: "Satisfy Auditors & Regulators", desc: "Provide verifiable totals, tax bases and reporting on encrypted payroll — meeting external compliance without leaking individual data." },
    { icon: Lock, title: "Honor Data Protection Laws", desc: "Stay aligned with GDPR and similar privacy regimes. Employee compensation is never disclosed beyond what the law actually requires." },
    { icon: Globe, title: "Reduce Legal & Reputational Risk", desc: "Avoid the legal exposure that comes with publicly visible on-chain salaries — wrongful disclosure, discrimination claims, and talent poaching." },
  ];

  return (
    <div className="min-h-screen font-sans bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/90 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={28} alt="Privapay" />
            <span className="text-lg font-semibold text-foreground tracking-tight">PriviPay</span>
          </Link>
<div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground">
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-2 rounded-lg px-5">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-8 sm:pt-28 sm:pb-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium mb-8">
              <Zap className="h-3.5 w-3.5" />
              Powered by Fully Homomorphic Encryption
              <ChevronRight className="h-3.5 w-3.5" />
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
              The payroll platform{" "}
              <span className="text-primary">built for privacy</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Organizations want it. Managers choose it. Employees love it.
              <br className="hidden sm:block" />
              Privacy-first payroll powered by on-chain encryption.
            </p>

<div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gap-2 rounded-lg px-8 h-12 text-base">
                  Launch Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="rounded-lg px-8 h-12 text-base">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>

          <DashboardMockup />

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-card border border-border/50">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Core Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Privacy + Compliance, Not Secrecy
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              FHE ensures salary data is never exposed — even during computation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-xl bg-card border border-border/60 hover:border-primary/25 transition-all duration-200 hover:shadow-md">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Three steps to private payroll
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-border" />
                )}
                <div className="flex flex-col items-start p-6 rounded-xl bg-card border border-border/60">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {s.step}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Why PriviPay</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Why confidential payroll matters
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Public salary data creates real operational and strategic problems for organizations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {benefits.map((b) => (
              <div key={b.title} className="flex gap-4 p-6 rounded-xl bg-card border border-border/60 hover:border-primary/20 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              Ready to protect your payroll?
            </h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8 text-lg">
              Join organizations that trust PriviPay for confidential, compliant, and verifiable payroll management.
            </p>
<div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="gap-2 rounded-lg px-8 h-12 text-base font-semibold">
                  Get Started Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="ghost" className="rounded-lg px-8 h-12 text-base text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
              <Logo size={28} alt="Privapay" />
              <span className="font-semibold text-foreground">PriviPay</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
              <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by Zama Protocol & FHE
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
