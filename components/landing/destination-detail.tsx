"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button, DestinationCard } from "@/components/fastbird";
import {
  buildPlans,
  flagUrl,
  type Destination,
} from "@/constants/destinations";

const included = [
  "Data-only plan — no contract, no commitment",
  "Instant QR delivery to your account",
  "Keep your own number and apps active",
  "Hotspot sharing where the destination allows it",
  "24/7 support if anything needs a hand",
];

const installSteps = [
  "On Wi-Fi, open your phone settings and find “Add eSIM” or “Add data plan”.",
  "Scan the FastBird QR code we send to your account.",
  "Label the new line “FastBird” so it’s easy to spot.",
  "When you land, switch on data roaming for the FastBird line.",
];

type DestinationDetailProps = {
  destination: Destination;
  nearby: Destination[];
};

export const DestinationDetail = ({
  destination,
  nearby,
}: DestinationDetailProps) => {
  const plans = buildPlans(destination);
  const [selectedId, setSelectedId] = useState(
    plans.find((p) => p.popular)?.id ?? plans[0].id
  );
  const selected = plans.find((p) => p.id === selectedId) ?? plans[0];

  return (
    <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
      <div>
        {/* Plan selector */}
        <h2 className="font-heading text-h2 font-medium text-ink">
          Choose your plan
        </h2>
        <p className="mt-2 text-[15px] text-ink-soft">
          Pick the data and validity that match your trip. Pay with Points.
        </p>

        <div
          className="mt-6 space-y-3"
          role="radiogroup"
          aria-label={`Plans for ${destination.name}`}
        >
          {plans.map((plan) => {
            const isSelected = plan.id === selectedId;
            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedId(plan.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-md border p-5 text-left transition-all fb-focus",
                  isSelected
                    ? "border-forest bg-forest/[0.04] shadow-fb-sm"
                    : "border-line bg-surface-card hover:bg-sand/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-pill border",
                      isSelected ? "border-forest bg-forest" : "border-line"
                    )}
                    aria-hidden
                  >
                    {isSelected && <Check className="h-3 w-3 text-on-dark" />}
                  </span>
                  <div>
                    <p className="font-heading text-xl font-medium text-ink">
                      {plan.data}
                    </p>
                    <p className="font-mono text-xs text-ink-soft">
                      Valid for {plan.validityDays} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {plan.popular && <Badge variant="gold">Popular</Badge>}
                  <span className="font-mono text-base text-ink">
                    {plan.points} Points
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* What's included */}
        <h2 className="mt-12 font-heading text-h2 font-medium text-ink">
          What&apos;s included
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-sage" aria-hidden />
              <span className="text-[15px] leading-relaxed text-ink-soft">
                {item}
              </span>
            </li>
          ))}
        </ul>

        {/* Install steps */}
        <h2 className="mt-12 font-heading text-h2 font-medium text-ink">
          Setting up takes a minute
        </h2>
        <ol className="mt-6 space-y-4">
          {installSteps.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-sand font-mono text-sm text-green">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="pt-1 text-[15px] leading-relaxed text-ink-soft">
                {step}
              </span>
            </li>
          ))}
        </ol>

        {/* Cross-sell */}
        {nearby.length > 0 && (
          <div className="mt-14">
            <h2 className="font-heading text-h3 font-medium text-ink">
              Nearby destinations
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {nearby.map((dest) => (
                <DestinationCard key={dest.slug} destination={dest} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky buy panel */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-md border border-line bg-surface-card p-6 shadow-fb-sm">
          <div className="flex items-center gap-3">
            <span className="relative h-8 w-11 overflow-hidden rounded-sm ring-1 ring-line">
              <Image
                src={flagUrl(destination.code, 160)}
                alt={`${destination.name} flag`}
                fill
                sizes="44px"
                className="object-cover"
              />
            </span>
            <p className="font-heading text-lg font-medium text-ink">
              {destination.name}
            </p>
          </div>

          <dl className="mt-6 space-y-3 border-t border-line pt-6">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-ink-soft">Data</dt>
              <dd className="font-mono text-sm text-ink">{selected.data}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-ink-soft">Validity</dt>
              <dd className="font-mono text-sm text-ink">
                {selected.validityDays} days
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <dt className="text-sm text-ink-soft">Total</dt>
              <dd className="font-heading text-2xl font-medium text-ink">
                {selected.points}{" "}
                <span className="font-mono text-sm text-ink-soft">Points</span>
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              href={`/dashboard/esims?buy=${destination.slug}&plan=${selected.id}`}
              variant="accent"
              size="lg"
            >
              Buy now
            </Button>
            <Button
              href={`/dashboard/wallet?add=${selected.points}`}
              variant="secondary"
              size="md"
            >
              Top up Points
            </Button>
          </div>

          <Link
            href="/pricing"
            className="mt-5 flex items-center justify-center gap-1 font-mono text-xs uppercase tracking-[0.06em] text-green underline-offset-4 hover:underline fb-focus"
          >
            How Points work
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>
    </div>
  );
};
