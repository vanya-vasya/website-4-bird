import type { Metadata } from "next";
import Image from "next/image";
import { Container, Eyebrow, Section, Button } from "@/components/fastbird";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Why FastBird exists: travel data without the roaming bills and SIM swaps, built on clarity, fairness, and reliability.",
};

const values = [
  {
    title: "Clarity",
    body: "Prices you can read at a glance and rules we say out loud. If you have to squint at the fine print, we've failed.",
  },
  {
    title: "Fairness",
    body: "Local-style rates instead of airport markups, and a balance that respects what you've already paid for.",
  },
  {
    title: "Reliability",
    body: "Trusted networks, instant delivery, and support that answers — because connectivity you can't count on isn't connectivity.",
  },
];

const StoryPage = () => (
  <>
    <section className="relative isolate overflow-hidden bg-forest text-on-dark">
      <Image
        src="/images/hero/story-hero.webp"
        alt="A FastBird swift leading a flight along a golden route across the sky"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-10 object-cover opacity-60"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest via-forest/80 to-forest/40" />
      <Container className="flex min-h-[60vh] flex-col justify-end py-24">
        <Eyebrow onDark>// OUR STORY</Eyebrow>
        <h1 className="mt-5 max-w-3xl font-heading text-4xl font-medium leading-tight lg:text-display-lg">
          Small, fast, and always finding the way home.
        </h1>
      </Container>
    </section>

    <Section tone="surface">
      <div className="fb-measure mx-auto">
        <p className="font-heading text-2xl font-medium leading-snug text-ink">
          FastBird started with a familiar sting: switching on your phone abroad
          and bracing for the bill.
        </p>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-ink-soft">
          <p>
            We were tired of hunting for SIM cards in unfamiliar airports, of
            roaming charges that arrived weeks later, and of plans written to
            confuse rather than to help. Travel had gone digital in every other
            way — getting online shouldn&apos;t be the part that still felt stuck
            in the past.
          </p>
          <p>
            So we built something simpler. A prepaid balance you top up once.
            Plans by destination, priced in plain Points. A QR code that arrives
            the instant you pay, ready to scan before you&apos;ve even left for
            the airport.
          </p>
          <p>
            The bird in our name isn&apos;t decoration. A swift is small and quick
            and crosses continents without fuss — and it always knows the way
            home. That&apos;s the feeling we want connectivity to have: light,
            dependable, and quietly there when you need it.
          </p>
        </div>
      </div>
    </Section>

    <Section tone="sand">
      <Eyebrow>// WHAT WE STAND FOR</Eyebrow>
      <h2 className="mt-4 max-w-xl font-heading text-h2 font-medium text-ink">
        Three things we won&apos;t compromise on.
      </h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {values.map((value, i) => (
          <div
            key={value.title}
            className="rounded-md border border-line bg-surface-card p-7 shadow-fb-sm"
          >
            <span className="font-mono text-eyebrow text-gold">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 font-heading text-h3 font-medium text-ink">
              {value.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              {value.body}
            </p>
          </div>
        ))}
      </div>
    </Section>

    <Section tone="dark">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow onDark>// THE SHORT VERSION</Eyebrow>
        <h2 className="mt-5 font-heading text-h2 font-medium">
          Travel data should feel like the easiest part of the trip.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-on-dark/75">
          That&apos;s the whole idea. Everything we build comes back to it.
        </p>
        <Button href="/products" variant="accent" size="lg" className="mt-8">
          Browse destinations
        </Button>
      </div>
    </Section>
  </>
);

export default StoryPage;
