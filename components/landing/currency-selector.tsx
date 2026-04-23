"use client";

import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Currency = {
  code: string;
  label: string;
  symbol: string;
  flag: string;
};

const CURRENCIES: Currency[] = [
  { code: "USD", label: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", label: "British Pound", symbol: "£", flag: "🇬🇧" },
];

const STORAGE_KEY = "yummi_currency";

const CurrencySelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Currency>(CURRENCIES[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = CURRENCIES.find((c) => c.code === stored);
      if (found) setSelected(found);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (currency: Currency) => {
    setSelected(currency);
    localStorage.setItem(STORAGE_KEY, currency.code);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (e.key === "Escape") setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      {/* Dropdown list — opens upward */}
      {isOpen && (
        <div
          className="absolute bottom-full mb-2 left-0 min-w-[200px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          role="listbox"
          aria-label="Currency options"
        >
          {CURRENCIES.map((currency) => {
            const isSelected = currency.code === selected.code;
            return (
              <button
                key={currency.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(currency)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                  isSelected
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                } ${currency !== CURRENCIES[CURRENCIES.length - 1] ? "border-b border-gray-100" : ""}`}
              >
                <span className="text-xl leading-none">{currency.flag}</span>
                <span
                  className="flex-1 text-sm font-semibold text-slate-900"
                  style={{
                    fontFamily:
                      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  {currency.code} - {currency.label}
                </span>
                {isSelected && <Check className="h-4 w-4 text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current currency: ${selected.code} (${selected.symbol}). Click to change currency`}
        className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span
          className="text-sm font-semibold text-slate-900"
          style={{
            fontFamily:
              'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {selected.code} ({selected.symbol})
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
    </div>
  );
};

export default CurrencySelector;
