"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { Loader2, ShoppingCart, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/contexts/cart-context";
import {
  getDestination,
  getPlan,
  flagUrl,
  type Plan,
  type Destination,
} from "@/constants/destinations";
import { formatEurFromPoints, PAYMENT_CURRENCY } from "@/constants/pricing";
import { discountedPoints, getPromoDiscount } from "@/constants/promo";

type CartLine = {
  key: string;
  destination: Destination;
  plan: Plan;
};

interface CheckoutResult {
  success?: boolean;
  redirect_url?: string;
  error?: string;
}

export const CartDrawer = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { items, removeItem, clear, isOpen, setOpen, hydrated } = useCart();
  const [agreed, setAgreed] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoPercent, setPromoPercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prices resolve from the catalog on every render — no stale cart pricing
  const lines: CartLine[] = useMemo(
    () =>
      items
        .map(({ destinationSlug, planId }) => {
          const destination = getDestination(destinationSlug);
          const plan = destination ? getPlan(destination, planId) : undefined;
          return destination && plan
            ? { key: `${destinationSlug}::${planId}`, destination, plan }
            : null;
        })
        .filter((x): x is CartLine => x !== null),
    [items]
  );

  const lineTotalPoints = lines.reduce((sum, l) => sum + l.plan.points, 0);
  const payPointsTotal = lines.reduce(
    (sum, l) => sum + discountedPoints(l.plan.points, promoPercent),
    0
  );

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
    if (lines.length === 0 || !agreed || isSubmitting) return;

    if (!isSignedIn) {
      setOpen(false);
      router.push("/sign-in");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/esim/cart-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({
            destinationSlug: l.destination.slug,
            planId: l.plan.id,
          })),
          promoCode:
            promoPercent > 0 ? `PROMO${promoPercent}` : "",
        }),
      });
      const data: CheckoutResult = await response.json();

      if (!response.ok || !data.success || !data.redirect_url) {
        toast.error(data.error || "Failed to start payment. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Order recorded as pending — safe to hand over to the payment page
      clear();
      window.location.href = data.redirect_url;
    } catch (error) {
      console.error("Cart checkout request error:", error);
      toast.error("Server connection error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-md border-line bg-surface p-8 sm:rounded-xl">
        <DialogTitle className="flex items-center justify-center gap-2 font-heading text-xl font-semibold text-ink">
          <ShoppingCart className="h-5 w-5" aria-hidden />
          Cart
        </DialogTitle>

        {hydrated && lines.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-soft">
            Your cart is empty. Add an eSIM plan from any destination page.
          </p>
        ) : (
          <>
            {/* Items */}
            <ul className="mt-6 space-y-3">
              {lines.map((line) => (
                <li
                  key={line.key}
                  className="flex items-center gap-3 rounded-md border border-line bg-surface-card p-3"
                >
                  <span className="relative h-7 w-10 shrink-0 overflow-hidden rounded-sm ring-1 ring-line">
                    <Image
                      src={flagUrl(line.destination.code, 80)}
                      alt={`${line.destination.name} flag`}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-[15px] font-medium text-ink">
                      {line.destination.name}
                    </p>
                    <p className="font-mono text-xs text-ink-soft">
                      {line.plan.data} · {line.plan.validityDays} days ·{" "}
                      {formatEurFromPoints(
                        discountedPoints(line.plan.points, promoPercent)
                      )}{" "}
                      {PAYMENT_CURRENCY}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      removeItem({
                        destinationSlug: line.destination.slug,
                        planId: line.plan.id,
                      })
                    }
                    aria-label={`Remove ${line.destination.name} ${line.plan.data} from cart`}
                    className="rounded-sm p-1.5 text-ink-soft transition-colors hover:bg-sand hover:text-ink fb-focus"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
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
              <span className="text-sm text-ink-soft">Total</span>
              <span className="font-heading text-2xl font-medium text-ink">
                {formatEurFromPoints(payPointsTotal)}{" "}
                <span className="font-mono text-sm text-ink-soft">
                  {PAYMENT_CURRENCY}
                </span>
                {promoPercent > 0 && (
                  <span className="ml-1 align-middle font-mono text-xs uppercase tracking-[0.06em] text-green">
                    −{promoPercent}% · was{" "}
                    {formatEurFromPoints(lineTotalPoints)}
                  </span>
                )}
              </span>
            </div>

            {/* Consent */}
            <div className="mt-5 flex items-start gap-3">
              <input
                id="cart-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-line accent-green"
              />
              <label
                htmlFor="cart-terms"
                className="text-sm leading-relaxed text-ink-soft"
              >
                I agree to the{" "}
                <a
                  href="/terms-and-conditions"
                  className="font-semibold text-ink underline underline-offset-2 hover:text-green"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy-policy"
                  className="font-semibold text-ink underline underline-offset-2 hover:text-green"
                >
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            {/* Pay */}
            <button
              type="button"
              onClick={handlePay}
              disabled={lines.length === 0 || !agreed || isSubmitting}
              aria-label={`Pay ${formatEurFromPoints(payPointsTotal)} EUR and proceed to payment`}
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-ink py-4 font-heading text-base font-semibold text-on-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  Redirecting to payment
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                </>
              ) : (
                <>Pay {formatEurFromPoints(payPointsTotal)} {PAYMENT_CURRENCY}</>
              )}
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};