import { Shield, Lock, Eye, Users, ArrowRight, CheckCircle, Zap, BarChart3, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    { icon: Lock, title: "Encrypted Salaries", description: "All salary data stored as encrypted integers (euint) on-chain. No raw values are ever exposed publicly.", color: "from-primary/20 to-primary/5" },
    { icon: Eye, title: "Selective Transparency", description: "Employees see only their own salary. Employers see all. Auditors see totals only — role-based decryption.", color: "from-accent/20 to-accent/5" },
    { icon: Users, title: "Confidential Voting", description: "Managers vote on bonuses privately. Results computed on encrypted data via Fully Homomorphic Encryption.", color: "from-chart-3/20 to-chart-3/5" },
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
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
              <Button size="sm" className="gap-2 rounded-xl shadow-lg shadow-primary/25 px-5">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 sm:pt-32 sm:pb-40">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/3 blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium mb-8 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5" />
              Powered by Fully Homomorphic Encryption
              <ChevronRight className="h-3.5 w-3.5" />
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold text-foreground tracking-tight leading-[1.1]">
              The payroll platform
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
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
                <Button size="lg" className="gap-2 rounded-xl px-8 h-12 text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                  Launch Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 text-base border-border/60 hover:bg-secondary/80">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Core Features</p>
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
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardContent className="relative pt-8 pb-8 px-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
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
      <section id="how-it-works" className="py-24 bg-card/50 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
                )}
                <div className="flex flex-col items-start p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/20 transition-all hover:shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/25">
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
      <section id="benefits" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Why PriviPay</p>
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
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-12 sm:p-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
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
      <footer className="border-t border-border/50 py-12 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/25">
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
