"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/contexts/currency-context";

interface PricingTier {
  id: string;
  name: string;
  description: string;
  gbpPrice: number | null;
  tokens: string;
  tokenRateGbp: number | null;
  discount?: string;
  features: string[];
  popular: boolean;
  color: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "Tracker",
    name: "Your Own Tracker",
    description: "For a quick start",
    gbpPrice: 20,
    tokens: "100 Tokens",
    tokenRateGbp: null,
    discount: "Standard Rate",
    features: ["Macros Generations"],
    popular: false,
    color: "from-purple-600 to-pink-600",
  },
  {
    id: "master-chef",
    name: "Your Own Chef",
    description: "Best value for regular use",
    gbpPrice: 40,
    tokens: "220 Tokens",
    tokenRateGbp: null,
    discount: "10% Token Discount",
    features: ["Recipe Generations"],
    popular: true,
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "master-nutritionist",
    name: "Your Own Nutritionist",
    description: "Maximum value package",
    gbpPrice: 60,
    tokens: "360 Tokens",
    tokenRateGbp: null,
    discount: "20% Token Discount",
    features: ["Consulting Generations"],
    popular: false,
    color: "from-blue-600 to-violet-600",
  },
  {
    id: "custom",
    name: "Custom Amount",
    description: "Perfect for your specific needs",
    gbpPrice: null,
    tokens: "",
    tokenRateGbp: 0.2,
    features: ["Pay Exactly What You Want"],
    popular: false,
    color: "from-orange-500 to-red-600",
  },
];

const interFont = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const Pricing = () => {
  const [customAmount, setCustomAmount] = useState("");
  const { currency, convert } = useCurrency();

  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-16 md:py-24 lg:py-32 bg-slate-100"
    >
      <div className="container relative mx-auto px-4">
        <div className="mx-auto flex max-w-4xl flex-col items-center space-y-8 text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center"
            style={{
              fontFamily: 'var(--contact-font)',
              fontWeight: 600,
              fontSize: '2.5rem',
              lineHeight: 1.1,
              letterSpacing: '0.01em',
              textTransform: 'none',
              color: '#1e293b',
              marginBottom: '1rem',
            }}
          >
            Pay-As-You-Go
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl text-base text-center"
            style={{
              fontFamily: 'var(--contact-font)',
              fontWeight: 600,
              letterSpacing: '0.01em',
              textTransform: 'none',
              color: '#475569',
            }}
          >
            Just pay-as-you-go tokens, with bigger packs for better value
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className={`relative rounded-2xl p-6 bg-white shadow-lg border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 h-full flex flex-col ${
                tier.popular
                  ? "border-green-400 ring-2 ring-green-400 ring-opacity-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Popular
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex flex-col flex-1 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: interFont }}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className="text-slate-600 text-sm"
                    style={{ fontFamily: interFont }}
                  >
                    {tier.description}
                  </p>
                </div>

                {/* Price — fixed tiers */}
                {tier.id !== "custom" && tier.gbpPrice !== null && (
                  <div className="text-center space-y-1">
                    <div
                      className="text-4xl font-bold text-slate-900"
                      style={{ fontFamily: interFont }}
                    >
                      {convert(tier.gbpPrice, 0)}
                    </div>
                    {tier.tokens && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2">
                          <p
                            className="text-green-600 font-semibold"
                            style={{ fontFamily: interFont }}
                          >
                            {tier.tokens}
                          </p>
                          {tier.discount && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                tier.discount === "Standard Rate"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {tier.discount}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Amount Input */}
                {tier.id === "custom" && (
                  <div className="text-center space-y-1">
                    <div className="relative">
                      <label
                        htmlFor={`custom-amount-${tier.id}`}
                        className="sr-only"
                      >
                        Enter custom amount in {currency.label}
                      </label>
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold pointer-events-none"
                        style={{ color: "#000" }}
                      >
                        {currency.symbol}
                      </span>
                      <input
                        id={`custom-amount-${tier.id}`}
                        type="number"
                        placeholder="25"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border-2 rounded-lg text-center text-2xl font-bold transition-all duration-200 bg-white focus:outline-none focus:ring-2"
                        style={{
                          fontFamily: interFont,
                          borderColor: "#000",
                          color: "#000",
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLInputElement).style.boxShadow =
                            "0 0 0 2px rgba(0,0,0,0.2)";
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLInputElement).style.boxShadow = "none";
                        }}
                        aria-describedby={`token-rate-${tier.id}`}
                      />
                    </div>
                    {tier.tokenRateGbp !== null && (
                      <p
                        id={`token-rate-${tier.id}`}
                        className="text-slate-500 text-xs mt-2"
                        style={{ fontFamily: interFont }}
                      >
                        {convert(tier.tokenRateGbp, 2)} per token
                      </p>
                    )}
                  </div>
                )}

                {/* Features */}
                <div className="flex-1 space-y-3">
                  <h4
                    className="text-sm font-semibold text-slate-900 uppercase tracking-wide"
                    style={{ fontFamily: interFont }}
                  >
                    What&apos;s Included
                  </h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span
                          className="text-slate-600 text-sm"
                          style={{ fontFamily: interFont }}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                      tier.popular
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
                        : "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
                    }`}
                    style={{ fontFamily: interFont }}
                  >
                    {tier.id === "custom" ? "Choose Amount" : "Begin"}
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        :root {
          --contact-font: Inter, system-ui, -apple-system, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
        }
      `}</style>
    </section>
  );
};

export default Pricing;
