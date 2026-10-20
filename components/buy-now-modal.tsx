"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { PAYMENT_CURRENCY } from "@/constants/pricing";

interface CheckoutResult {
  success?: boolean;
  redirect_url?: string;
  error?: string;
}

type BuyNowModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // e.g. "France 5 GB / 30 days"
  planLabel: string;
  // Pre-filled amount in EUR, e.g. "6.00"
  amountEur: string;
  promoPercent?: number;
  // Starts the payment; resolves with the hosted-checkout redirect URL
  onCheckout: () => Promise<CheckoutResult>;
};

const BuyNowModal = ({
  open,
  onOpenChange,
  planLabel,
  amountEur,
  promoPercent = 0,
  onCheckout,
}: BuyNowModalProps) => {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePay = async () => {
    if (!agreed || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const data = await onCheckout();

      if (!data.success || !data.redirect_url) {
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
          Checkout
        </DialogTitle>

        {/* Amount */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="rounded-xl border-2 border-ink px-5 py-2.5">
            <span className="font-mono text-sm font-semibold text-ink">
              {PAYMENT_CURRENCY}
            </span>
          </div>
          <span className="font-heading text-5xl font-bold text-ink tracking-tight">
            {amountEur}
          </span>
        </div>

        {/* Order summary */}
        <p className="mt-5 text-center text-sm text-ink-soft">
          {planLabel}
          {promoPercent > 0 && (
            <span className="ml-2 font-mono text-xs uppercase tracking-[0.06em] text-green">
              promo −{promoPercent}%
            </span>
          )}
        </p>

        {/* Terms checkbox */}
        <div className="mt-5 flex items-start gap-3">
          <input
            id="buy-now-terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-line accent-green"
          />
          <label htmlFor="buy-now-terms" className="text-sm leading-relaxed text-ink-soft">
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
          onClick={handlePay}
          disabled={!agreed || isSubmitting}
          aria-label={`Pay ${amountEur} EUR and proceed to payment`}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-ink py-4 font-heading text-base font-semibold text-on-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              Redirecting to payment
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            </>
          ) : (
            <>Pay {amountEur} {PAYMENT_CURRENCY}</>
          )}
        </button>

      </DialogContent>
    </Dialog>
  );
};

export default BuyNowModal;