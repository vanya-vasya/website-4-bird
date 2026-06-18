import type { Metadata } from "next";
import { Mail, Clock, Building2 } from "lucide-react";
import { Container, Eyebrow, Section } from "@/components/fastbird";
import { ContactForm } from "@/components/landing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the FastBird team for support, billing questions, or Business API enquiries. We reply around the clock.",
};

type SearchParams = { searchParams: { topic?: string } };

const ContactPage = ({ searchParams }: SearchParams) => (
  <>
    <section className="border-b border-line bg-sand">
      <Container className="py-16 lg:py-20">
        <Eyebrow>// CONTACT</Eyebrow>
        <h1 className="mt-4 max-w-2xl font-heading text-h1 font-medium text-ink">
          Talk to a human.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
          Questions about a plan, your balance, or building with our API? Send a
          note and we&apos;ll get back to you fast.
        </p>
      </Container>
    </section>

    <Section tone="surface">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <ContactForm defaultTopic={searchParams.topic} />

        <aside className="space-y-4">
          <div className="rounded-md border border-line bg-surface-card p-6 shadow-fb-sm">
            <Mail className="h-5 w-5 text-green" aria-hidden />
            <h2 className="mt-3 font-heading text-lg font-medium text-ink">
              Email support
            </h2>
            <a
              href="mailto:support@myfastbird.com"
              className="mt-1 block font-mono text-sm text-green underline-offset-4 hover:underline fb-focus"
            >
              support@myfastbird.com
            </a>
          </div>

          <div className="rounded-md border border-line bg-surface-card p-6 shadow-fb-sm">
            <Clock className="h-5 w-5 text-green" aria-hidden />
            <h2 className="mt-3 font-heading text-lg font-medium text-ink">
              Response time
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Around the clock, in any timezone. Most replies land within a few
              hours.
            </p>
          </div>

          <div className="rounded-md border border-line bg-surface-card p-6 shadow-fb-sm">
            <Building2 className="h-5 w-5 text-green" aria-hidden />
            <h2 className="mt-3 font-heading text-lg font-medium text-ink">
              Business API
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Reselling or integrating eSIM data? Pick the Business API topic and
              our partnerships team will reach out.
            </p>
          </div>

          {/* TODO: replace with the real registered company entity and address */}
          <p className="font-mono text-xs leading-relaxed text-ink-soft">
            FASTBIRD — [Company name], Company No. [____], [registered address].
          </p>
        </aside>
      </div>
    </Section>
  </>
);

export default ContactPage;
