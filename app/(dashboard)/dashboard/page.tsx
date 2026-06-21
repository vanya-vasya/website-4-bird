"use client";

import { Wifi, MapPin, CreditCard, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/fastbird";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120 },
  },
};

const quickActions = [
  {
    id: "browse",
    label: "Browse eSIMs",
    icon: MapPin,
    description: "Search 60+ countries and regions and pick the plan that fits your trip.",
    href: "/products",
  },
  {
    id: "active",
    label: "Active Plans",
    icon: Wifi,
    description: "View and manage your currently active eSIM plans and data usage.",
    href: "/dashboard/activity-history",
  },
  {
    id: "billing",
    label: "Billing & Payments",
    icon: CreditCard,
    description: "Check your payment history, invoices, and top-up your balance.",
    href: "/dashboard/billing/payment-history",
  },
];

export default function DashboardHomePage() {
  const router = useRouter();

  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <p className="font-mono text-eyebrow uppercase text-ink-soft tracking-[0.06em]">
          // DASHBOARD
        </p>
        <h1 className="font-heading text-h1 font-medium text-ink">
          Welcome back.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
          Manage your eSIM plans, top up your balance, and stay connected wherever you travel.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {quickActions.map((action) => (
          <motion.div key={action.id} variants={item}>
            <button
              type="button"
              onClick={() => router.push(action.href)}
              className="group w-full rounded-md border border-line bg-surface-card p-6 text-left shadow-fb-sm transition-shadow hover:shadow-fb-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-sand text-green">
                <action.icon className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="font-heading text-lg font-medium text-ink">
                {action.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {action.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.06em] text-green transition-gap group-hover:gap-2">
                Go <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </button>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex items-center gap-4 rounded-md border border-line bg-sand p-6">
        <Wifi className="h-6 w-6 shrink-0 text-green" aria-hidden />
        <div className="flex-1">
          <p className="font-medium text-ink">No active eSIM yet?</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            Browse our plans and get connected in minutes — no physical SIM needed.
          </p>
        </div>
        <Button href="/products" variant="accent" size="sm">
          Browse plans
        </Button>
      </div>
    </div>
  );
}
