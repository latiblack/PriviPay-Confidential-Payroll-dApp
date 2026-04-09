import { Shield, Lock, Eye, Users, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: Lock,
      title: "Encrypted Salaries",
      description: "All salary data stored as euint on-chain. No raw values are ever exposed publicly.",
    },
    {
      icon: Eye,
      title: "Selective Transparency",
      description: "Employees see only their own salary. Employers see all. Auditors see totals only.",
    },
    {
      icon: Users,
      title: "Confidential Bonus Voting",
      description: "Managers vote on bonuses privately. Results computed on encrypted data via FHE.",
    },
  ];

  const benefits = [
    "Prevents internal salary conflicts & politics",
    "Blocks competitor talent poaching",
    "Compliant privacy — not secrecy",
    "Verifiable totals without exposing individuals",
    "Protects employees from personal security risks",
    "Enables honest, bias-free bonus allocation",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Shield className="h-4 w-4 text-primary" />
            Powered by Zama Protocol & FHE
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground tracking-tight max-w-4xl mx-auto">
            Confidential Onchain{" "}
            <span className="text-primary">Payroll</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            The first payroll platform for all. Organizations want it, managers choose it,
            employees love it — powered by Fully Homomorphic Encryption.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/employer">
              <Button size="lg" className="gap-2">
                Launch App <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Privacy + Compliance, Not Secrecy
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <Card key={f.title} className="bg-card border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
              Why Confidential Payroll Matters
            </h2>
            <p className="text-muted-foreground text-center mb-10">
              Public salary data creates real operational and strategic problems for organizations.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((b) => (
                <div key={b} className="flex items-start gap-3 p-4 rounded-lg bg-card border">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-12">How FHE Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Encrypt", desc: "Salaries stored as encrypted integers (euint) on-chain" },
              { step: "2", title: "Compute", desc: "Smart contracts compute totals on encrypted data — no decryption needed" },
              { step: "3", title: "Decrypt Selectively", desc: "Only authorized roles can decrypt specific data based on access rules" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>PriviPay — The first payroll platform for all. Powered by Zama Protocol & FHE</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
