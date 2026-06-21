import Link from "next/link";
import { AnimatedLayout, AnimatedPage } from "@/components/animated-layout";
import DashboardHeader from "@/components/dashboard-header";
import { CreditProvider } from "@/lib/contexts/credit-context";
import {
  getApiUsedGenerations,
  getApiAvailableGenerations,
} from "@/lib/api-limit";

// Dashboard is always rendered at request time — never statically generated.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiUsedGenerations = await getApiUsedGenerations();
  const apiAvailableGenerations = await getApiAvailableGenerations();

  return (
    <CreditProvider
      initialUsedGenerations={apiUsedGenerations}
      initialAvailableGenerations={apiAvailableGenerations}
    >
      <div className="relative min-h-screen bg-surface">
        <AnimatedLayout>
          <DashboardHeader
            initialUsedGenerations={apiUsedGenerations}
            initialAvailableGenerations={apiAvailableGenerations}
          />
        </AnimatedLayout>

        <main className="flex-1 py-12 lg:pt-16 relative z-10">
          <div className="container py-8 md:py-10">
            <AnimatedPage>{children}</AnimatedPage>
          </div>
        </main>

        <footer className="border-t border-line bg-surface py-6">
          <div className="container flex flex-col items-center justify-between gap-3 md:flex-row">
            <p className="font-mono text-xs text-ink-soft">
              © {new Date().getFullYear()} FastBird. All rights reserved.
            </p>
            <nav className="flex gap-4" aria-label="Legal">
              {[
                { href: "/privacy-policy", label: "Privacy" },
                { href: "/terms-and-conditions", label: "Terms" },
                { href: "/return-policy", label: "Refund" },
                { href: "/cookies-policy", label: "Cookies" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="font-mono text-xs text-ink-soft transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </CreditProvider>
  );
}
