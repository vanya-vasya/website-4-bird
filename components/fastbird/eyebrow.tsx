import { cn } from "@/lib/utils";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
  onDark?: boolean;
};

export const Eyebrow = ({ children, className, onDark = false }: EyebrowProps) => (
  <p
    className={cn(
      "font-mono text-eyebrow uppercase",
      onDark ? "text-sage" : "text-green",
      className
    )}
  >
    {children}
  </p>
);
