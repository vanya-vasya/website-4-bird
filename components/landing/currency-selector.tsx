"use client";

import { CURRENCIES, useCurrency } from "@/contexts/currency-context";
import type { CurrencyCode } from "@/contexts/currency-context";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
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
      {/* Dropdown — opens upward */}
      {isOpen && (
        <div
          className="absolute bottom-full mb-2 left-0 min-w-[220px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          role="listbox"
          aria-label="Currency options"
        >
          {CURRENCIES.map((c, i) => {
            const isSelected = c.code === currency.code;
            return (
              <button
                key={c.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(c.code)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                } ${i !== CURRENCIES.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <span className="text-xl leading-none">{c.flag}</span>
                <span
                  className="flex-1 text-sm font-semibold text-slate-900"
                  style={{
                    fontFamily:
                      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  {c.code} — {c.label}
                </span>
                {isSelected && <Check className="h-4 w-4 text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current currency: ${currency.code} (${currency.symbol}). Click to change`}
        className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <span className="text-lg leading-none">{currency.flag}</span>
        <span
          className="text-sm font-semibold text-slate-900"
          style={{
            fontFamily:
              'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {currency.code} ({currency.symbol})
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
