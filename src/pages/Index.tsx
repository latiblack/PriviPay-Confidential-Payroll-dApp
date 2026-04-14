import React from "react";
import Logo from "../components/Logo";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Logo size={120} alt="PriviPay Logo" />
      <h1 className="mt-4 text-2xl font-semibold">PriviPay – Index</h1>
      <p className="mt-2 text-muted-foreground">This page uses the shared logo.png asset.</p>
    </div>
  );
};

export default Index;
