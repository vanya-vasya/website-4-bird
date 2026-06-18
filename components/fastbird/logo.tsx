import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Use the cream mark + cream wordmark for dark backgrounds. */
  onDark?: boolean;
  className?: string;
  href?: string;
  /** Hide the wordmark, show only the bird mark. */
  markOnly?: boolean;
};

export const Logo = ({
  onDark = false,
  className,
  href = "/",
  markOnly = false,
}: LogoProps) => {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={onDark ? "/images/brand/logo-mark-on-dark.png" : "/images/brand/logo-mark.png"}
        alt="FastBird"
        width={40}
        height={40}
        priority
        className="h-9 w-9 object-contain"
      />
      {!markOnly && (
        <span
          className={cn(
            "font-heading text-2xl font-medium tracking-tight",
            onDark ? "text-on-dark" : "text-forest"
          )}
        >
          FastBird
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="FastBird home" className="fb-focus rounded-sm">
      {content}
    </Link>
  );
};
