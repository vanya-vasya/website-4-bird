import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill font-mono text-[11px] uppercase tracking-[0.06em] px-2.5 py-1",
  {
    variants: {
      variant: {
        gold: "bg-gold/15 text-[#8a6614] ring-1 ring-gold/40",
        sage: "bg-sage/15 text-green ring-1 ring-sage/40",
        neutral: "bg-ink/5 text-ink-soft ring-1 ring-line",
        onDark: "bg-on-dark/10 text-on-dark ring-1 ring-on-dark/20",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
