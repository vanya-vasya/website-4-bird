"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const RATE_PER_TOKEN = 0.2; // £0.20 per token

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateCheckoutResponse {
  success?: boolean;
  redirect_url?: string;
  error?: string;
  details?: string;
}

const BuyCreditsModal = ({ open, onOpenChange }: BuyCreditsModalProps) => {
  const { userId } = useAuth();
  const { user } = useUser();
  const [tokenAmount, setTokenAmount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gbpTotal = (tokenAmount * RATE_PER_TOKEN).toFixed(2);

  const handleIncrement = () => setTokenAmount((v) => v + 1);
  const handleDecrement = () => setTokenAmount((v) => Math.max(0, v - 1));
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setTokenAmount(isNaN(val) || val < 0 ? 0 : val);
  };

  const handleBuyTokens = async () => {
    if (!agreed || tokenAmount === 0 || isSubmitting) return;

    if (!userId) {
      toast.error("Please sign in to buy tokens");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payment/secure-processor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: tokenAmount * RATE_PER_TOKEN,
          currency: "GBP",
          // Format matters: the webhook parses the Clerk id back out of "gen_<clerkId>_<ts>"
          orderId: `gen_${userId}_${Date.now()}`,
          // Format matters: the webhook extracts the token count from "(N Tokens)"
          description: `FastBird Tokens Purchase (${tokenAmount} Tokens)`,
          customerEmail: user?.primaryEmailAddress?.emailAddress ?? "",
        }),
      });

      const data: CreateCheckoutResponse = await response.json();

      if (!response.ok || !data.success || !data.redirect_url) {
        console.error("Checkout creation failed:", data);
        toast.error(data.error || "Failed to start payment. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Redirect to the Secure-Processor hosted payment page
      window.location.href = data.redirect_url;
    } catch (error) {
      console.error("Checkout request error:", error);
      toast.error("Server connection error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-line bg-surface p-8 sm:rounded-xl">
        <DialogTitle className="text-center font-heading text-xl font-semibold text-ink">
          Buy More
        </DialogTitle>

        {/* Currency + amount */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="rounded-xl border-2 border-ink px-5 py-2.5">
            <span className="font-mono text-sm font-semibold text-ink">GBP</span>
          </div>
          <span className="font-heading text-5xl font-bold text-ink tracking-tight">
            {gbpTotal}
          </span>
        </div>

        {/* Token input */}
        <div className="mt-8 space-y-2">
          <label
            htmlFor="token-amount"
            className="font-sans text-sm text-ink-soft"
          >
            Enter token amount
          </label>
          <div className="relative flex items-center overflow-hidden rounded-xl border border-line bg-surface focus-within:ring-2 focus-within:ring-green">
            <input
              id="token-amount"
              type="number"
              min={0}
              value={tokenAmount}
              onChange={handleInputChange}
              className="w-full bg-transparent py-4 pl-6 pr-14 text-center font-heading text-2xl font-semibold text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <div className="absolute right-0 flex h-full flex-col border-l border-line">
              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Increase token amount"
                className="flex flex-1 items-center justify-center px-3 text-ink-soft transition-colors hover:bg-sand hover:text-ink"
              >
                <svg className="h-3 w-3" viewBox="0 0 12 8" fill="none" aria-hidden>
                  <path d="M1 7l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="h-px bg-line" />
              <button
                type="button"
                onClick={handleDecrement}
                aria-label="Decrease token amount"
                className="flex flex-1 items-center justify-center px-3 text-ink-soft transition-colors hover:bg-sand hover:text-ink"
              >
                <svg className="h-3 w-3" viewBox="0 0 12 8" fill="none" aria-hidden>
                  <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Terms checkbox */}
        <div className="mt-5 flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-line accent-green"
          />
          <label htmlFor="terms" className="text-sm leading-relaxed text-ink-soft">
            I agree to the{" "}
            <Link
              href="/terms-and-conditions"
              className="font-semibold text-ink underline underline-offset-2 hover:text-green"
              onClick={() => onOpenChange(false)}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy-policy"
              className="font-semibold text-ink underline underline-offset-2 hover:text-green"
              onClick={() => onOpenChange(false)}
            >
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleBuyTokens}
          disabled={!agreed || tokenAmount === 0 || isSubmitting}
          aria-label="Buy tokens and proceed to payment"
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-ink py-4 font-heading text-base font-semibold text-on-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              Redirecting to payment
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            </>
          ) : (
            <>
              Buy Tokens
              <Zap className="h-4 w-4 fill-on-dark" aria-hidden />
            </>
          )}
        </button>

      </DialogContent>
    </Dialog>
  );
};

export default BuyCreditsModal;
