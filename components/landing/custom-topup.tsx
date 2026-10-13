"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/fastbird";
import { startTopUpCheckout } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import { pointsFromEur } from "@/constants/pricing";

const customPerks = [
  "Choose exactly what you need",
  "Minimum top-up is 1 EUR",
  "Valid for any destination",
];

export const CustomTopup = ({ className }: { className?: string }) => {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!valid || isSubmitting) return;

    if (!userId) {
      router.push("/sign-in");
      return;
    }

    setIsSubmitting(true);

    startTopUpCheckout({
      userId,
      email: user?.primaryEmailAddress?.emailAddress,
      points: pointsFromEur(value),
    })
      .then((redirectUrl) => {
        window.location.href = redirectUrl;
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Server connection error. Please try again."
        );
        setIsSubmitting(false);
      });
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div>
          <h2 className="font-heading text-h3 font-medium text-ink">
            Custom amount
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Prefer your own number? Add exactly what you need.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <input
              id="custom-amount"
              type="number"
              inputMode="decimal"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              aria-label="Amount to add in EUR"
              className="w-28 bg-transparent font-heading text-stat font-medium text-ink placeholder:text-ink/30 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="font-mono text-sm text-ink-soft">EUR</span>
          </div>
          <p className="mt-1 font-mono text-xs text-ink-soft">minimum 1 EUR</p>
        </div>

        <ul className="mt-6 flex-1 space-y-3">
          {customPerks.map((perk) => (
            <li key={perk} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-sage" aria-hidden />
              <span className="text-[15px] text-ink-soft">{perk}</span>
            </li>
          ))}
        </ul>

        <Button
          type="submit"
          variant="secondary"
          size="md"
          className="mt-7 w-full"
          disabled={!valid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Redirecting…
            </>
          ) : (
            `Top up ${valid ? `${value} EUR` : "balance"}`
          )}
        </Button>
      </form>
    </Card>
  );
};