import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Timer,
  Headphones,
  SlidersHorizontal,
  Wifi,
  Coins,
  Send,
  ArrowRight,
} from "lucide-react";
import {
  Button,
  Container,
  Eyebrow,
  Section,
  Card,
  Badge,
  Accordion,
  DestinationCard,
} from "@/components/fastbird";
import { popularDestinations } from "@/constants/destinations";
import { faqTeaser } from "@/constants/faq";

const trustChips = [
  "100+ destinations",
  "Instant QR delivery",
  "24/7 support",
  "No roaming fees",
];

const valueCards = [
  {
    title: "No hidden charges",
    body: "The price you see is the price you pay. No surprise roaming bills waiting when you get home.",
  },
  {
    title: "Set up in minutes",
    body: "Scan a QR code from your phone settings and you're ready before the seatbelt sign turns off.",
  },
  {
    title: "Always-on support",
    body: "Real people, any hour, in any timezone. If a plan misbehaves, we sort it out fast.",
  },
  {
    title: "Flexible data",
    body: "From a weekend city break to a months-long trip, pick the data and validity that fit.",
  },
];

const steps = [
  {
    n: "01",
    title: "Top up your balance",
    body: "Add Points to your wallet once. Use them on any destination, any time.",
    img: "/images/spots/step-topup.webp",
  },
  {
    n: "02",
    title: "Choose your destination",
    body: "Search 60+ countries and regions and pick the plan that fits your trip.",
    img: "/images/spots/step-destination.webp",
  },
  {
    n: "03",
    title: "Get your QR instantly",
    body: "Your eSIM lands in your account the moment you pay — no waiting, no post.",
    img: "/images/spots/step-qr.webp",
  },
  {
    n: "04",
    title: "Activate and connect",
    body: "Scan, switch on data when you land, and you're online in minutes.",
    img: "/images/spots/step-activate.webp",
  },
];

const benefits = [
  {
    icon: SlidersHorizontal,
    title: "Flexible packages",
    body: "Data sizes and validity windows for every kind of trip.",
  },
  {
    icon: Send,
    title: "Fast digital delivery",
    body: "Your QR is ready in your account the second you check out.",
  },
  {
    icon: Coins,
    title: "Affordable rates",
    body: "Local-style pricing without the airport-counter markup.",
  },
  {
    icon: SlidersHorizontal,
    title: "Easy to manage",
    body: "Track usage, top up, and view every order from one place.",
  },
  {
    icon: Wifi,
    title: "Reliable coverage",
    body: "Trusted networks at each destination so you stay connected.",
  },
  {
    icon: Headphones,
    title: "24/7 support",
    body: "Help whenever you need it, wherever you happen to be.",
  },
];

const HomePage = () => (
  <>
    {/* 1. Hero */}
    <section className="relative isolate overflow-hidden bg-forest text-on-dark">
      <Image
        src="/images/hero/home-hero.webp"
        alt="A FastBird swift in flight tracing a glowing connectivity route"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-10 object-cover opacity-70"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/85 to-forest/30" />
      <Container className="flex min-h-[88vh] flex-col justify-center py-28">
        <div className="max-w-2xl">
          <Eyebrow onDark>// TRAVEL DATA, MADE CALM</Eyebrow>
          <h1 className="mt-5 font-heading text-[2.75rem] font-medium leading-[1.05] sm:text-5xl lg:text-display-xl">
            Land anywhere. You&apos;re already online.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-dark/80">
            FastBird gives you instant eSIM data wherever you travel — no plastic
            SIMs to swap, no roaming shocks when you get home. Top up, scan, and
            connect in minutes.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button href="/products" variant="accent" size="lg">
              Get your eSIM
            </Button>
            <Button href="/#how-it-works" variant="outlineOnDark" size="lg">
              How it works
            </Button>
          </div>
        </div>
      </Container>
    </section>

    {/* 2. Trust strip */}
    <div className="border-b border-line bg-surface">
      <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 sm:justify-between">
        {trustChips.map((chip) => (
          <span
            key={chip}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] text-ink-soft"
          >
            <span className="h-1.5 w-1.5 rounded-pill bg-sage" aria-hidden />
            {chip}
          </span>
        ))}
      </Container>
    </div>

    {/* 3. Why FastBird */}
    <Section tone="sand">
      <Eyebrow>// WHY FASTBIRD</Eyebrow>
      <h2 className="mt-4 max-w-xl font-heading text-h2 font-medium text-ink">
        Connectivity that respects your trip — and your budget.
      </h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {valueCards.map((card) => (
          <Card key={card.title}>
            <h3 className="font-heading text-h3 font-medium text-ink">
              {card.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              {card.body}
            </p>
          </Card>
        ))}
      </div>
    </Section>

    {/* 4. How it works */}
    <Section id="how-it-works" tone="surface">
      <Eyebrow>// HOW IT WORKS</Eyebrow>
      <h2 className="mt-4 max-w-xl font-heading text-h2 font-medium text-ink">
        Four steps from landing to online.
      </h2>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.n}>
            <div className="relative aspect-square overflow-hidden rounded-md border border-line bg-sand">
              <Image
                src={step.img}
                alt={step.title}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <p className="mt-5 font-mono text-eyebrow text-gold">{step.n}</p>
            <h3 className="mt-2 font-heading text-h3 font-medium text-ink">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </Section>

    {/* 5. Popular destinations */}
    <Section tone="sand">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>// POPULAR DESTINATIONS</Eyebrow>
          <h2 className="mt-4 font-heading text-h2 font-medium text-ink">
            Where travelers are heading.
          </h2>
        </div>
        <Link
          href="/products"
          className="group inline-flex items-center gap-2 font-mono text-eyebrow uppercase text-green underline-offset-4 hover:underline fb-focus"
        >
          View all destinations
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {popularDestinations.map((dest) => (
          <DestinationCard key={dest.slug} destination={dest} />
        ))}
      </div>
    </Section>

    {/* 6. Benefits grid */}
    <Section tone="surface">
      <Eyebrow>// WHAT YOU GET</Eyebrow>
      <h2 className="mt-4 max-w-xl font-heading text-h2 font-medium text-ink">
        Everything you need, nothing you don&apos;t.
      </h2>
      <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((b) => (
          <div key={b.title} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-sand text-green">
              <b.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </span>
            <div>
              <h3 className="font-heading text-xl font-medium text-ink">
                {b.title}
              </h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
                {b.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>

    {/* 7. Business API teaser */}
    <Section tone="sand">
      <Card className="flex flex-col items-start gap-6 p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <Eyebrow>// FOR TEAMS</Eyebrow>
            <Badge variant="sage">Business API</Badge>
          </div>
          <h2 className="mt-4 font-heading text-h2 font-medium text-ink">
            Connectivity your customers can build on.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            Resell eSIM data, bundle it into your product, or keep a fleet of
            travelers connected. Our API handles provisioning and delivery so you
            can focus on your offer.
          </p>
        </div>
        <Button href="/contact?topic=business-api" variant="primary" size="lg">
          Talk to us
        </Button>
      </Card>
    </Section>

    {/* 8. FAQ teaser */}
    <Section tone="surface">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow>// GOOD TO KNOW</Eyebrow>
          <h2 className="mt-4 font-heading text-h2 font-medium text-ink">
            Questions, answered.
          </h2>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-soft">
            The short version below. For everything else, the full FAQ has you
            covered.
          </p>
          <Button href="/faq" variant="secondary" size="md" className="mt-6">
            Read the full FAQ
          </Button>
        </div>
        <Accordion items={faqTeaser} defaultOpen={0} />
      </div>
    </Section>

    {/* 9. Final CTA */}
    <Section tone="dark">
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow onDark>// READY WHEN YOU ARE</Eyebrow>
        <h2 className="mt-5 font-heading text-4xl font-medium leading-tight lg:text-display-lg">
          Your next trip is one tap from connected.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-on-dark/75">
          Set up your wallet, pick a destination, and travel knowing your data is
          already sorted.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Button href="/products" variant="accent" size="lg">
            Get your eSIM
          </Button>
          <Button href="/pricing" variant="outlineOnDark" size="lg">
            See pricing
          </Button>
        </div>
      </div>
    </Section>
  </>
);

export default HomePage;
