import type { Metadata } from "next";
import { ShoppingBag, Wallet, Power, Activity as ActivityIcon } from "lucide-react";
import {
  Container,
  Eyebrow,
  Section,
  Button,
  ActivityTimeline,
} from "@/components/fastbird";
import { mockActivities } from "@/constants/activities";

export const metadata: Metadata = {
  title: "Activities",
  description:
    "Track every order, top-up, activation, and data usage in one clear timeline inside your FastBird dashboard.",
};

const tracked = [
  {
    icon: ShoppingBag,
    title: "Orders",
    body: "Every plan you buy, with destination, size, and the Points spent.",
  },
  {
    icon: Wallet,
    title: "Top-ups",
    body: "When you added Points and how much landed in your balance.",
  },
  {
    icon: Power,
    title: "Activations",
    body: "The moment each eSIM went live, ready to scan and connect.",
  },
  {
    icon: ActivityIcon,
    title: "Data usage",
    body: "How much of each plan you've used, so there are no surprises.",
  },
];

const ActivitiesPage = () => (
  <>
    <section className="border-b border-line bg-sand">
      <Container className="py-16 lg:py-20">
        <Eyebrow>{"// ACTIVITIES"}</Eyebrow>
        <h1 className="mt-4 max-w-2xl font-heading text-h1 font-medium text-ink">
          A clear record of everything.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
          Your dashboard keeps a tidy timeline of every order, top-up,
          activation, and data session — so you always know where your Points
          went.
        </p>
      </Container>
    </section>

    <Section tone="surface">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div>
          <Eyebrow>{"// WHAT YOU CAN TRACK"}</Eyebrow>
          <h2 className="mt-4 font-heading text-h2 font-medium text-ink">
            Four kinds of activity, one feed.
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {tracked.map((t) => (
              <div key={t.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-sand text-green">
                  <t.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-medium text-ink">
                    {t.title}
                  </h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">
                    {t.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button href="/dashboard/activities" variant="primary" size="md" className="mt-8">
            View your activities
          </Button>
        </div>

        <div>
          <p className="mb-4 font-mono text-eyebrow uppercase text-green">
            {"// SAMPLE TIMELINE"}
          </p>
          <ActivityTimeline items={mockActivities} />
        </div>
      </div>
    </Section>
  </>
);

export default ActivitiesPage;
