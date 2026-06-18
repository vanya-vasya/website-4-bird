import { cn } from "@/lib/utils";
import { Container } from "./container";

type Tone = "surface" | "dark" | "sand";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  /** Render without the inner Container (for full-bleed content). */
  bare?: boolean;
  id?: string;
};

const toneClasses: Record<Tone, string> = {
  surface: "bg-surface text-ink",
  dark: "bg-forest text-on-dark",
  sand: "bg-sand text-ink",
};

export const Section = ({
  children,
  className,
  tone = "surface",
  bare = false,
  id,
}: SectionProps) => (
  <section
    id={id}
    className={cn("py-14 sm:py-20 lg:py-section", toneClasses[tone], className)}
  >
    {bare ? children : <Container>{children}</Container>}
  </section>
);
