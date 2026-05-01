export const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  NGN: { symbol: "₦", name: "Nigerian Naira" },
};

export const getCurrencySymbol = (currency?: string): string => {
  const curr = currency || localStorage.getItem("privipay-currency") || "USD";
  return CURRENCIES[curr]?.symbol || "$";
};

export const formatCurrency = (amount: number, currency?: string): string => {
  const symbol = getCurrencySymbol(currency);
  const curr = currency || localStorage.getItem("privipay-currency") || "USD";
  
  if (curr === "NGN") {
    return `${symbol}${amount.toLocaleString("en-NG")}`;
  }
  return `${symbol}${amount.toLocaleString()}`;
};

export const getStoredCurrency = (): string => {
  return localStorage.getItem("privipay-currency") || "USD";
};

export const getStoredLanguage = (): string => {
  return localStorage.getItem("privipay-language") || "en";
};