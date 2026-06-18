import { Container, Eyebrow } from "@/components/fastbird";

export type LegalSection = {
  heading: string;
  body: string[];
};

type LegalPageProps = {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export const LegalPage = ({
  title,
  intro,
  lastUpdated,
  sections,
}: LegalPageProps) => (
  <>
    <section className="border-b border-line bg-sand">
      <Container className="py-16 lg:py-20">
        <Eyebrow>// LEGAL</Eyebrow>
        <h1 className="mt-4 font-heading text-h1 font-medium text-ink">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
          {intro}
        </p>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.06em] text-ink-soft">
          Last updated: {lastUpdated}
        </p>
      </Container>
    </section>

    <section className="bg-surface py-14 lg:py-20">
      <Container className="max-w-measure">
        {/* TODO: this is scaffolding copy — have it reviewed by legal counsel
            and insert the registered FastBird entity details before launch. */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <div key={section.heading}>
              <h2 className="font-heading text-h3 font-medium text-ink">
                <span className="mr-2 font-mono text-base text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.body.map((para, j) => (
                  <p
                    key={j}
                    className="text-[15px] leading-relaxed text-ink-soft"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 rounded-md border border-line bg-sand p-5 font-mono text-xs leading-relaxed text-ink-soft">
          Questions about this policy? Email support@myfastbird.com. FASTBIRD —
          [Company name], Company No. [____], [registered address].
        </p>
      </Container>
    </section>
  </>
);
