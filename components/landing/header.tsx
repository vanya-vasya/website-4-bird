"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Container, Logo } from "@/components/fastbird";
import { mainNav, productsMenu } from "@/constants/nav";

const Header = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !open;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkColor = transparent
    ? "text-on-dark/90 hover:text-on-dark"
    : "text-ink-soft hover:text-ink";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        transparent
          ? "bg-transparent"
          : "border-b border-line bg-surface/90 backdrop-blur-md"
      )}
    >
      <Container className="flex h-16 items-center justify-between lg:h-18">
        <Logo onDark={transparent} />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {mainNav.map((item) =>
            item.label === "Products" ? (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setProductsOpen(true)}
                onMouseLeave={() => setProductsOpen(false)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 font-sans text-[15px] transition-colors fb-focus rounded-sm",
                    linkColor
                  )}
                >
                  {item.label}
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </Link>
                {productsOpen && (
                  <div className="absolute left-1/2 top-full w-60 -translate-x-1/2 pt-3">
                    <div className="overflow-hidden rounded-md border border-line bg-surface-card p-2 shadow-fb-md">
                      {productsMenu.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block rounded-sm px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink fb-focus"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-sans text-[15px] transition-colors fb-focus rounded-sm",
                  linkColor
                )}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <span
            className={cn(
              "flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.06em]",
              transparent ? "text-on-dark/80" : "text-ink-soft"
            )}
            aria-label="Points balance"
          >
            <Clock className="h-3.5 w-3.5" aria-hidden />0 Points
          </span>
          <Link
            href="/sign-in"
            className={cn(
              "font-mono text-eyebrow uppercase underline-offset-4 transition-colors hover:underline fb-focus rounded-sm",
              transparent ? "text-on-dark" : "text-green"
            )}
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
          className={cn(
            "rounded-sm p-2 lg:hidden fb-focus",
            transparent ? "text-on-dark" : "text-ink"
          )}
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
