"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap } from "lucide-react";
import { Container, Logo } from "@/components/fastbird";
import { UserDropdown } from "@/components/user-dropdown";
import { GuestMobileSidebar } from "@/components/guest-mobile-sidebar";
import { PaymentHistoryAnalytics } from "@/lib/analytics";
import { mainNav } from "@/constants/nav";
import { useCredits } from "@/lib/contexts/credit-context";
import BuyCreditsModal from "@/components/buy-credits-modal";

const dashboardNav = [
  { name: "Payments", href: "/dashboard/billing/payment-history" },
  { name: "Activities", href: "/dashboard/activity-history" },
];

const DashboardHeader = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const { remainingCredits } = useCredits();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const allMobileNav = [
    ...mainNav.map((i) => ({ name: i.label, href: i.href })),
    ...dashboardNav,
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-surface/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between lg:h-18">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Dashboard primary">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-sans text-[15px] text-ink-soft transition-colors hover:text-ink fb-focus rounded-sm"
            >
              {item.label}
            </Link>
          ))}
          {dashboardNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-sans text-[15px] text-ink-soft transition-colors hover:text-ink fb-focus rounded-sm"
              onClick={() => {
                if (item.name === "Payments") {
                  PaymentHistoryAnalytics.clickPaymentHistoryLink("dashboard_header");
                }
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <button
            type="button"
            aria-label={`${remainingCredits} credits — buy more`}
            onClick={() => setBuyModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-green px-4 py-2 text-white transition-opacity hover:opacity-90 fb-focus"
          >
            <Zap className="h-4 w-4 fill-white" aria-hidden />
            <span className="font-semibold text-sm">{remainingCredits}</span>
            <span className="text-sm font-normal opacity-80">credits</span>
          </button>
          <UserDropdown />
        </div>

        <BuyCreditsModal open={buyModalOpen} onOpenChange={setBuyModalOpen} />

        <div className="flex items-center gap-2 lg:hidden">
          <GuestMobileSidebar />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="rounded-sm p-2 fb-focus text-ink"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="fixed inset-0 top-16 z-40 bg-surface lg:hidden">
          <Container className="flex h-full flex-col py-8">
            <nav className="flex flex-col gap-1" aria-label="Mobile dashboard">
              {allMobileNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-line py-4 font-heading text-2xl text-ink transition-colors hover:text-green"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
