import React from "react";
import Logo from "../components/Logo";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#fcfbf8' }}>
      <Logo size={120} alt="Privapay Logo" />
      <h1 className="text-2xl font-semibold mt-4">Privapay – Index</h1>
      <p className="text-muted-foreground mt-2">This page uses the shared logo2.png asset.</p>
    </div>
  );
};

export default Index;
