import type { Metadata } from "next";
import { Container, Eyebrow, Section, Accordion, Button } from "@/components/fastbird";
import { faqCategories } from "@/constants/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers on eSIM basics, device compatibility, buying and activation, Points and billing, and troubleshooting.",
};

const FaqPage = () => (
  <>
    <section className="border-b border-line bg-sand">
      <Container className="py-16 lg:py-20">
        <Eyebrow>// HELP CENTER</Eyebrow>
        <h1 className="mt-4 max-w-2xl font-heading text-h1 font-medium text-ink">
          Everything you might want to ask.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
          Short, straight answers about how FastBird works. Still stuck? Our
          support team is one message away.
        </p>
      </Container>
    </section>

    <Section tone="surface">
      <div className="space-y-16">
        {faqCategories.map((cat) => (
          <div key={cat.title} className="grid gap-8 lg:grid-cols-[0.5fr_1.5fr]">
            <div>
              <Eyebrow>{cat.eyebrow}</Eyebrow>
              <h2 className="mt-3 font-heading text-h3 font-medium text-ink">
                {cat.title}
              </h2>
            </div>
            <Accordion items={cat.items} />
          </div>
        ))}
      </div>

      <div className="mt-20 rounded-md border border-line bg-sand p-8 text-center lg:p-10">
        <h2 className="font-heading text-h3 font-medium text-ink">
          Didn&apos;t find your answer?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-soft">
          Send us the details and we&apos;ll get back to you quickly — any hour,
          any timezone.
        </p>
        <Button href="/contact" variant="primary" size="md" className="mt-6">
          Contact support
        </Button>
      </div>
    </Section>
  </>
);

export default FaqPage;
