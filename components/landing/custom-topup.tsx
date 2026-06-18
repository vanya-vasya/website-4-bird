"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/fastbird";

export const CustomTopup = () => {
  const router = useRouter();
  const [amount, setAmount] = useState("");

  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    router.push(`/dashboard/wallet?add=${value}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-line bg-surface-card p-6 shadow-fb-sm"
    >
      <h3 className="font-heading text-h3 font-medium text-ink">Custom amount</h3>
      <p className="mt-2 text-[15px] text-ink-soft">
        Prefer your own number? Add exactly what you need (minimum 5 Points).
      </p>
      <div className="mt-5">
        <label
          htmlFor="custom-amount"
          className="font-mono text-eyebrow uppercase text-green"
        >
          Points to add
        </label>
        <div className="relative mt-2">
          <Clock
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
          <input
            id="custom-amount"
            type="number"
            inputMode="decimal"
            min={5}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50"
            className="h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 font-mono text-ink placeholder:text-ink-soft fb-focus"
          />
        </div>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="md"
        className="mt-5 w-full"
        disabled={!valid}
      >
        Top up {valid ? `${value} Points` : "Points"}
      </Button>
    </form>
  );
};
