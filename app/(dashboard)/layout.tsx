import { AnimatedLayout, AnimatedPage } from "@/components/animated-layout";
import DashboardHeader from "@/components/dashboard-header";
import { CreditProvider } from "@/lib/contexts/credit-context";
import Footer from "@/components/landing/footer";
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

        <Footer />
      </div>
    </CreditProvider>
  );
}
