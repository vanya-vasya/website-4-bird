"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Loader2, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  flagUrl,
  type Destination,
  type Plan,
} from "@/constants/destinations";
import { formatEurFromPoints, PAYMENT_CURRENCY } from "@/constants/pricing";
import { discountedPoints, getPromoDiscount } from "@/constants/promo";

interface CheckoutResult {
  success?: boolean;
  redirect_url?: string;
  error?: string;
}

type BuyNowModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The plan being checked out
  destination: Destination;
  plan: Plan;
  // Prefilled from the buy panel
  initialQty: number;
  initialPromo?: { code: string; percent: number } | null;
  // Starts the payment; resolves with the hosted-checkout redirect URL
  onCheckout: (args: {
    quantity: number;
    promoCode: string;
  }) => Promise<CheckoutResult>;
};

const MAX_QTY = 100;

// Single-plan checkout, styled like the cart: an item card with a per-eSIM
// quantity stepper, a promo field and a Total row with the eSIM count.
const BuyNowModal = ({
  open,
  onOpenChange,
  destination,
  plan,
  initialQty,
  initialPromo,
  onCheckout,
}: BuyNowModalProps) => {
  const [qty, setQty] = useState(initialQty);
  const [promoInput, setPromoInput] = useState(initialPromo?.code ?? "");
  const [promoPercent, setPromoPercent] = useState(initialPromo?.percent ?? 0);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill from the buy panel every time the modal opens
  useEffect(() => {
    if (open) {
      setQty(initialQty);
      setPromoInput(initialPromo?.code ?? "");
      setPromoPercent(initialPromo?.percent ?? 0);
      setAgreed(false);
    }
  }, [open, initialQty, initialPromo]);

  const perEsimPoints = discountedPoints(plan.points, promoPercent);
  const totalPoints = perEsimPoints * qty;

  const applyPromo = () => {
    const code = promoInput.trim();
    if (!code) {
      setPromoPercent(0);
      return;
    }
    const percent = getPromoDiscount(code);
    if (percent) {
      setPromoPercent(percent);
    } else {
      setPromoPercent(0);
      toast.error("Invalid promo code");
    }
  };

  const handlePay = async () => {
    if (!agreed || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const data = await onCheckout({
        quantity: qty,
        promoCode: promoPercent > 0 ? promoInput.trim().toUpperCase() : "",
      });

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

        {/* Item card — same design as a cart line */}
        <ul className="mt-6 space-y-3">
          <li className="rounded-md border border-line bg-surface-card p-3">
            <div className="flex items-center gap-3">
              <span className="relative h-7 w-10 shrink-0 overflow-hidden rounded-sm ring-1 ring-line">
                <Image
                  src={flagUrl(destination.code, 80)}
                  alt={`${destination.name} flag`}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[15px] font-medium text-ink">
                  {destination.name}
                </p>
                <p className="font-mono text-xs text-ink-soft">
                  {plan.data} · {plan.validityDays} days ·{" "}
                  {formatEurFromPoints(perEsimPoints)}{" "}
                  {PAYMENT_CURRENCY}/eSIM
                </p>
              </div>
            </div>

            {/* Quantity stepper */}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <span className="font-mono text-xs text-ink-soft">eSIMs</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease eSIM count"
                  className="flex h-6 w-6 items-center justify-center rounded-sm border border-line bg-surface fb-focus transition-colors hover:bg-sand disabled:opacity-40 disabled:hover:bg-surface"
                >
                  <Minus className="h-3 w-3" aria-hidden />
                </button>
                <span
                  className="w-10 text-center font-mono text-sm text-ink"
                  aria-live="polite"
                  aria-label={`Number of eSIMs: ${qty}`}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((v) => Math.min(MAX_QTY, v + 1))}
                  disabled={qty >= MAX_QTY}
                  aria-label="Increase eSIM count"
                  className="flex h-6 w-6 items-center justify-center rounded-sm border border-line bg-surface fb-focus transition-colors hover:bg-sand disabled:opacity-40 disabled:hover:bg-surface"
                >
                  <Plus className="h-3 w-3" aria-hidden />
                </button>
                <span className="font-mono text-xs text-ink">
                  {formatEurFromPoints(totalPoints)} {PAYMENT_CURRENCY}
                </span>
              </div>
            </div>
          </li>
        </ul>

        {/* Promo */}
        <div className="mt-5 flex items-center gap-2">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            onBlur={applyPromo}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyPromo();
            }}
            placeholder="Promocode"
            aria-label="Promocode"
            className="w-full rounded-sm border border-line bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:font-mono placeholder:text-ink-soft/50 fb-focus"
          />
          {promoPercent > 0 && (
            <span className="shrink-0 font-mono text-xs uppercase tracking-[0.04em] text-green">
              −{promoPercent}%
            </span>
          )}
        </div>

        {/* Total */}
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm text-ink-soft">
            Total · {qty} eSIM{qty === 1 ? "" : "s"}
          </span>
          <span className="font-heading text-2xl font-medium text-ink">
            {formatEurFromPoints(totalPoints)}{" "}
            <span className="font-mono text-sm text-ink-soft">
              {PAYMENT_CURRENCY}
            </span>
            {promoPercent > 0 && (
              <span className="ml-1 align-middle font-mono text-xs uppercase tracking-[0.06em] text-green">
                −{promoPercent}% · was {formatEurFromPoints(plan.points * qty)}
              </span>
            )}
          </span>
        </div>

        {/* Consent */}
        <div className="mt-5 flex items-start gap-3">
          <input
            id="buy-now-terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-line accent-green"
          />
          <label
            htmlFor="buy-now-terms"
            className="text-sm leading-relaxed text-ink-soft"
          >
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

        {/* Pay */}
        <button
          type="button"
          onClick={handlePay}
          disabled={!agreed || isSubmitting}
          aria-label={`Pay ${formatEurFromPoints(totalPoints)} EUR and proceed to payment`}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-ink py-4 font-heading text-base font-semibold text-on-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              Redirecting to payment
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            </>
          ) : (
            <>Pay {formatEurFromPoints(totalPoints)} {PAYMENT_CURRENCY}</>
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default BuyNowModal;