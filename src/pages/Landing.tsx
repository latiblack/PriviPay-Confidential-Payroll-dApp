import { Shield, Lock, Eye, Users, ArrowRight, Zap, BarChart3, Globe, ChevronRight, TrendingUp, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const DashboardMockup = () => (
  <div className="relative w-full max-w-4xl mx-auto mt-16">
    {/* Glow behind the mockup */}
    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-60" />
    
    <div className="relative rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-chart-4/60" />
          <div className="w-3 h-3 rounded-full bg-accent/60" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-6 rounded-lg bg-muted/50 max-w-xs mx-auto flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground">app.privipay.io/dashboard</span>
          </div>
        </div>
      </div>
      
      {/* Dashboard content */}
      <div className="p-6 grid grid-cols-3 gap-4">
        {/* Stat cards */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Payroll</span>
          </div>
          <p className="text-xl font-bold text-foreground">$847,290</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-accent" />
            <span className="text-[10px] text-accent font-medium">+12.5%</span>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted-foreground">Employees</span>
          </div>
          <p className="text-xl font-bold text-foreground">1,247</p>
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="h-3 w-3 text-accent" />
            <span className="text-[10px] text-accent font-medium">All encrypted</span>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-chart-3/10 to-chart-3/5 border border-chart-3/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-chart-3" />
            <span className="text-xs text-muted-foreground">Security</span>
          </div>
          <p className="text-xl font-bold text-foreground">100%</p>
          <div className="flex items-center gap-1 mt-1">
            <Lock className="h-3 w-3 text-chart-3" />
            <span className="text-[10px] text-chart-3 font-medium">FHE Protected</span>
          </div>
        </div>

        {/* Chart area */}
        <div className="col-span-2 rounded-xl bg-muted/20 border border-border/30 p-4 h-32">
          <p className="text-xs text-muted-foreground mb-3">Monthly Payroll Distribution</p>
          <div className="flex items-end gap-1.5 h-16">
            {[40, 55, 35, 65, 50, 75, 60, 80, 70, 90, 85, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-primary to-primary/40" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-muted/20 border border-border/30 p-4 h-32">
          <p className="text-xs text-muted-foreground mb-3">Encryption Status</p>
          <div className="relative w-16 h-16 mx-auto mt-2">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" className="stroke-muted/30" />
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
  const features = [
    { icon: Lock, title: "Encrypted Salaries", description: "All salary data stored as encrypted integers (euint) on-chain. No raw values are ever exposed publicly.", color: "from-primary to-primary/60" },
    { icon: Eye, title: "Selective Transparency", description: "Employees see only their own salary. Employers see all. Auditors see totals only — role-based decryption.", color: "from-accent to-accent/60" },
    { icon: Users, title: "Confidential Voting", description: "Managers vote on bonuses privately. Results computed on encrypted data via Fully Homomorphic Encryption.", color: "from-chart-3 to-chart-3/60" },
  ];

  const stats = [
    { value: "$2.4B+", label: "Payroll Processed" },
    { value: "10,000+", label: "Employees Protected" },
    { value: "99.99%", label: "Uptime" },
    { value: "0", label: "Data Breaches" },
  ];

  const steps = [
    { step: "01", title: "Encrypt", desc: "Salaries are encrypted client-side before being stored as euint256 on the blockchain. Nobody — not even validators — can see the data.", icon: Lock },
    { step: "02", title: "Compute", desc: "Smart contracts perform payroll calculations directly on encrypted data using FHE. No decryption needed during computation.", icon: Zap },
    { step: "03", title: "Decrypt Selectively", desc: "Only authorized roles can decrypt specific data. Access rules are enforced cryptographically, not by policy alone.", icon: Eye },
  ];

  const benefits = [
    { icon: Shield, title: "Prevent Salary Politics", desc: "Eliminate internal conflicts caused by salary visibility. Keep compensation confidential without being secretive." },
    { icon: Globe, title: "Block Talent Poaching", desc: "Competitors can't target your team based on compensation data. Your salary structure stays private." },
    { icon: BarChart3, title: "Verifiable Compliance", desc: "Auditors can verify payroll totals and tax compliance without seeing individual salaries." },
    { icon: Users, title: "Fair Bonus Allocation", desc: "Anonymous voting ensures bias-free bonus decisions. Results are computed on encrypted votes." },
  ];

  return (
    <div className="min-h-screen font-sans bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">PriviPay</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/employer">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/employer">
              <Button size="sm" className="gap-2 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 px-5 hover:opacity-90 transition-opacity border-0">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with strong gradient background */}
      <section className="relative overflow-hidden pt-20 pb-8 sm:pt-28 sm:pb-16">
        {/* Gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-bl from-primary/20 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-accent/15 to-transparent blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-chart-3/10 to-primary/10 blur-[100px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-1.5 text-sm text-primary font-medium mb-8 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5" />
              Powered by Fully Homomorphic Encryption
              <ChevronRight className="h-3.5 w-3.5" />
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
              <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                The payroll platform
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-chart-3 bg-clip-text text-transparent">
                built for everyone
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Organizations want it. Managers choose it. Employees love it.
              <br className="hidden sm:block" />
              Privacy-first payroll powered by on-chain encryption.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/employer">
                <Button size="lg" className="gap-2 rounded-xl px-8 h-12 text-base bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/25 hover:opacity-90 transition-all border-0">
                  Launch Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 text-base border-border/60 hover:bg-secondary/80 backdrop-blur-sm">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>

          {/* Dashboard mockup */}
          <DashboardMockup />

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-wider mb-3">Core Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Privacy + Compliance, Not Secrecy
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              FHE ensures salary data is never exposed — even during computation. Every operation happens on encrypted data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="group relative overflow-hidden border border-border/60 bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardContent className="relative pt-8 pb-8 px-6">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 opacity-80`}>
                    <f.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-card/80 via-primary/5 to-accent/5" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Three steps to private payroll
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/40 to-transparent" />
                )}
                <div className="flex flex-col items-start p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 hover:border-primary/20 transition-all hover:shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/25">
                      {s.step}
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-wider mb-3">Why PriviPay</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Why confidential payroll matters
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Public salary data creates real operational and strategic problems for organizations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((b) => (
              <div key={b.title} className="flex gap-4 p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/20 transition-all hover:shadow-lg group">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-12 sm:p-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Ready to protect your payroll?
              </h2>
              <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8 text-lg">
                Join organizations that trust PriviPay for confidential, compliant, and verifiable payroll management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/employer">
                  <Button size="lg" variant="secondary" className="gap-2 rounded-xl px-8 h-12 text-base font-semibold shadow-xl">
                    Get Started Free <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="ghost" className="rounded-xl px-8 h-12 text-base text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-gradient-to-b from-card/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">PriviPay</span>
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
