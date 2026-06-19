"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Clock } from "lucide-react";
import { Button, Container, Logo } from "@/components/fastbird";
import { mainNav } from "@/constants/nav";

const Header = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isDashboard = pathname.startsWith("/dashboard");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-surface/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between lg:h-18">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-sans text-[15px] text-ink-soft transition-colors hover:text-ink fb-focus rounded-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isDashboard && (
            <span
              className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.06em] text-ink-soft"
              aria-label="Points balance"
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />0 Points
            </span>
          )}
          <Link
            href="/sign-in"
            className="font-mono text-eyebrow uppercase underline-offset-4 transition-colors hover:underline fb-focus rounded-sm text-green"
          >
            Log in
          </Link>
          <Button href="/sign-up" variant="accent" size="sm">
            Get started
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="rounded-sm p-2 lg:hidden fb-focus text-ink"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {open && (
        <div className="fixed inset-0 top-16 z-40 bg-surface lg:hidden">
          <Container className="flex h-full flex-col py-8">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-line py-4 font-heading text-2xl text-ink transition-colors hover:text-green"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-3">
              <Button href="/sign-up" variant="accent" size="lg">
                Get started
              </Button>
              <Button href="/sign-in" variant="secondary" size="lg">
                Log in
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
};

export default Header;
