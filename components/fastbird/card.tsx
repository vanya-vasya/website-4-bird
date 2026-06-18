import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Sand card for use on dark sections. */
  onDark?: boolean;
  interactive?: boolean;
};

export const Card = ({
  className,
  onDark = false,
  interactive = false,
  ...props
}: CardProps) => (
  <div
    className={cn(
      "rounded-md border p-6",
      onDark
        ? "border-transparent bg-sand text-ink shadow-fb-sm"
        : "border-line bg-surface-card text-ink shadow-fb-sm",
      interactive &&
        "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-fb-md",
      className
    )}
    {...props}
  />
);
