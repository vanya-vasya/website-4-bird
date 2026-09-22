"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/fastbird";
import { startTopUpCheckout } from "@/lib/checkout";
import { cn } from "@/lib/utils";

const customPerks = [
  "Choose exactly what you need",
  "Minimum 5 Points to top up",
  "Valid for any destination",
];

export const CustomTopup = ({ className }: { className?: string }) => {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || isSubmitting) return;

    if (!userId) {
      router.push("/sign-in");
      return;
    }

    setIsSubmitting(true);

    try {
      const redirectUrl = await startTopUpCheckout({
        userId,
        email: user?.primaryEmailAddress?.emailAddress,
        points: value,
      });
      window.location.href = redirectUrl;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Server connection error. Please try again."
      );
      setIsSubmitting(false);
    }
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
              min={5}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              aria-label="Points to add"
              className="w-28 bg-transparent font-heading text-stat font-medium text-ink placeholder:text-ink/30 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="font-mono text-sm text-ink-soft">Points</span>
          </div>
          <p className="mt-1 font-mono text-xs text-ink-soft">minimum 5</p>
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
            `Top up ${valid ? `${value} Points` : "Points"}`
          )}
        </Button>
      </form>
    </Card>
  );
};
