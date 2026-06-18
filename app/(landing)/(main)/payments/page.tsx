import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Receipt, RefreshCcw, Coins } from "lucide-react";
import { Container, Eyebrow, Section, Card, Button } from "@/components/fastbird";

export const metadata: Metadata = {
  title: "Payments",
  description:
    "How FastBird payments and Points top-ups work — accepted methods, security, receipts, and refunds.",
};

const methods = ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"];

const assurances = [
  {
    icon: Lock,
    title: "Encrypted checkout",
    body: "Payments are processed over secure, encrypted connections. We never see or store your full card number.",
  },
  {
    icon: ShieldCheck,
    title: "Handled by certified processors",
    body: "Card details are handled by established payment providers who carry the relevant industry security certifications.",
  },
  {
    icon: Receipt,
    title: "Receipts for every top-up",
    body: "Each top-up generates a receipt in your dashboard, so expensing a trip is straightforward.",
  },
];

const PaymentsPage = () => (
  <>
    <section className="border-b border-line bg-sand">
      <Container className="py-16 lg:py-20">
        <Eyebrow>// PAYMENTS</Eyebrow>
        <h1 className="mt-4 max-w-2xl font-heading text-h1 font-medium text-ink">
          Top up with confidence.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
          Add Points with the card or wallet you already use. Here&apos;s exactly
          how payment works and how we keep it secure.
        </p>
      </Container>
    </section>

    <Section tone="surface">
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <Coins className="h-6 w-6 text-green" aria-hidden />
          <h2 className="mt-4 font-heading text-h3 font-medium text-ink">
            How top-ups become Points
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            Choose a top-up pack or a custom amount, pay once, and your balance
            updates instantly. Points sit in your wallet until you spend them on a
            destination plan — there&apos;s no per-purchase card juggling.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            The exact conversion between your currency and Points is always shown
            before you confirm.
          </p>
        </Card>

        <Card>
          <p className="font-mono text-eyebrow uppercase text-green">
            Accepted methods
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {methods.map((m) => (
              <li
                key={m}
                className="rounded-sm border border-line bg-surface px-3 py-1.5 font-mono text-xs uppercase tracking-[0.04em] text-ink-soft"
              >
                {m}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
            {/* TODO: confirm the final processor and supported methods at launch */}
            Availability can vary slightly by region. If your preferred method
            isn&apos;t listed at checkout, get in touch and we&apos;ll help.
          </p>
        </Card>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {assurances.map((a) => (
          <Card key={a.title}>
            <a.icon className="h-6 w-6 text-green" strokeWidth={1.5} aria-hidden />
            <h3 className="mt-4 font-heading text-lg font-medium text-ink">
              {a.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              {a.body}
            </p>
          </Card>
        ))}
      </div>
    </Section>

    <Section tone="sand">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <RefreshCcw className="h-5 w-5 text-green" aria-hidden />
            <Eyebrow>// REFUNDS</Eyebrow>
          </div>
          <h2 className="mt-4 font-heading text-h2 font-medium text-ink">
            If something doesn&apos;t work, we make it right.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            If a plan can&apos;t be delivered or activated, contact support and
            we&apos;ll resolve it — whether that&apos;s a fix or a refund of the
            Points involved. Full eligibility and timelines are in our Refund
            Policy.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button href="/return-policy" variant="primary" size="md">
            Read the Refund Policy
          </Button>
          <Button href="/contact" variant="secondary" size="md">
            Contact support
          </Button>
        </div>
      </div>
      <p className="mt-8 font-mono text-xs text-ink-soft">
        See also:{" "}
        <Link href="/terms-and-conditions" className="text-green hover:underline">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/privacy-policy" className="text-green hover:underline">
          Privacy
        </Link>
      </p>
    </Section>
  </>
);

export default PaymentsPage;
