import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-sans font-medium transition-colors duration-200 fb-focus disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary page CTA
        primary: "bg-forest text-on-dark hover:bg-green",
        // High-intent only — at most one per viewport
        accent: "bg-gold text-ink hover:brightness-105",
        // Outline on transparent, fills sand on hover
        secondary: "border border-line bg-transparent text-ink hover:bg-sand",
        // On dark sections
        outlineOnDark:
          "border border-on-dark/30 bg-transparent text-on-dark hover:bg-on-dark/10",
        // Link / ghost
        ghost:
          "bg-transparent px-0 font-mono text-eyebrow uppercase text-green underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type BaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = ({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonProps) => {
  const classes = cn(buttonVariants({ variant, size }), className);

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
};
