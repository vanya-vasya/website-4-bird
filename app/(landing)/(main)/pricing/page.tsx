import type { Metadata } from "next";
import { Check } from "lucide-react";
import {
  Container,
  Eyebrow,
  Section,
  Card,
  Badge,
  Button,
  Accordion,
} from "@/components/fastbird";
import { CustomTopup } from "@/components/landing/custom-topup";

export const metadata: Metadata = {
  title: "Pricing & Points",
  description:
    "FastBird runs on a simple prepaid Points balance. Top up once, spend on any destination. Bigger top-ups carry more value.",
};

const packs = [
  {
    name: "Starter",
    points: 25,
    bonus: 0,
    blurb: "A weekend away or a quick city break.",
    perks: ["Enough for light maps, chat and email", "Use across any destination"],
  },
  {
    name: "Traveler",
    points: 60,
    bonus: 5,
    blurb: "The sweet spot for most trips.",
    perks: [
      "Covers a fortnight of everyday use",
      "Best value per Point",
      "+5 bonus Points included",
    ],
    popular: true,
  },
  {
    name: "Frequent Flyer",
    points: 120,
    bonus: 15,
    blurb: "Long trips and back-to-back travel.",
    perks: [
      "Months of data on hand",
      "Top value for heavy travel",
      "+15 bonus Points included",
    ],
  },
];

const billingFaq = [
  {
    question: "Do my Points expire?",
    answer:
      "Your balance is built to stay ready for your travels. If any time limits ever apply, we show them clearly at top-up — never buried in fine print.",
  },
  {
    question: "Can I get a refund on Points?",
    answer:
      "Unused balance and undelivered plans are covered by our refund approach. The Payments page summarises eligibility and the Refund Policy has the detail.",
  },
  {
    question: "What currency are Points tied to?",
    answer:
      "Points are FastBird's own prepaid unit. You buy them with your card or wallet, and the conversion is shown before you confirm any top-up.",
  },
];

const PricingPage = () => (
  <>
    <section className="border-b border-line bg-sand">
      <Container className="py-16 lg:py-20">
        <Eyebrow>// PRICING</Eyebrow>
        <h1 className="mt-4 max-w-2xl font-heading text-h1 font-medium text-ink">
          One balance. Every destination.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
          FastBird runs on Points — a prepaid balance you top up once and spend
          on any plan. The more you add, the more each Point is worth.
        </p>
        <p className="mt-6 font-mono text-xs text-ink-soft">
          100 Points ≈ roughly two weeks of everyday data across most destinations
        </p>
      </Container>
    </section>

    <Section tone="surface">
      <div className="grid gap-5 lg:grid-cols-3">
        {packs.map((pack) => (
          <Card
            key={pack.name}
            className={pack.popular ? "ring-2 ring-gold" : undefined}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-h3 font-medium text-ink">
                {pack.name}
              </h2>
              {pack.popular && <Badge variant="gold">Popular</Badge>}
            </div>
            <p className="mt-2 text-sm text-ink-soft">{pack.blurb}</p>
            <p className="mt-6 font-heading text-stat font-medium text-ink">
              {pack.points}
              <span className="ml-2 font-mono text-sm text-ink-soft">Points</span>
            </p>
            {pack.bonus > 0 && (
              <p className="mt-1 font-mono text-xs text-green">
                +{pack.bonus} bonus included
              </p>
            )}
            <ul className="mt-6 space-y-3">
              {pack.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-sage"
                    aria-hidden
                  />
                  <span className="text-[15px] text-ink-soft">{perk}</span>
                </li>
              ))}
            </ul>
            <Button
              href={`/dashboard/wallet?add=${pack.points}`}
              variant={pack.popular ? "accent" : "secondary"}
              size="md"
              className="mt-7 w-full"
            >
              Top up {pack.points} Points
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <CustomTopup />
      </div>
    </Section>

    <Section tone="sand">
      <div className="grid gap-8 lg:grid-cols-[0.6fr_1.4fr]">
        <div>
          <Eyebrow>// BILLING</Eyebrow>
          <h2 className="mt-3 font-heading text-h2 font-medium text-ink">
            The money questions.
          </h2>
        </div>
        <Accordion items={billingFaq} />
      </div>
    </Section>
  </>
);

export default PricingPage;
