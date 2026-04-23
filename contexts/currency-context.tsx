"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CurrencyCode = "GBP" | "USD" | "EUR";

export type CurrencyConfig = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  flag: string;
  rate: number; // rate relative to GBP base
};

export const CURRENCIES: CurrencyConfig[] = [
  { code: "GBP", label: "British Pound", symbol: "£", flag: "🇬🇧", rate: 1 },
  { code: "USD", label: "US Dollar",     symbol: "$", flag: "🇺🇸", rate: 1.27 },
  { code: "EUR", label: "Euro",          symbol: "€", flag: "🇪🇺", rate: 1.18 },
];

type CurrencyContextValue = {
  currency: CurrencyConfig;
  setCurrency: (code: CurrencyCode) => void;
  /** Convert a GBP base amount and return a formatted string, e.g. "$25.40" */
  convert: (gbpAmount: number, fractionDigits?: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "yummi_currency";

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyConfig>(CURRENCIES[0]); // GBP default

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (stored) {
      const found = CURRENCIES.find((c) => c.code === stored);
      if (found) setCurrencyState(found);
    }
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (!found) return;
    setCurrencyState(found);
    localStorage.setItem(STORAGE_KEY, code);
  };

  const convert = (gbpAmount: number, fractionDigits = 2): string => {
    const converted = gbpAmount * currency.rate;
    const rounded = Math.round(converted * 100) / 100;
    return `${currency.symbol}${rounded.toFixed(fractionDigits)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within <CurrencyProvider>");
  return ctx;
};
