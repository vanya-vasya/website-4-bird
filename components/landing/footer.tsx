import Link from "next/link";
import { Instagram } from "lucide-react";
import { Container, Logo } from "@/components/fastbird";
import { footerNav } from "@/constants/nav";

const paymentMethods = ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"];

const Footer = () => (
  <footer className="bg-forest text-on-dark">
    <Container className="py-16 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Logo onDark />
          <p className="mt-4 text-sm leading-relaxed text-on-dark/70">
            Travel data that just works — top up, tap, and you&apos;re online in
            minutes.
          </p>
          <Link
            href="https://instagram.com"
            aria-label="FastBird on Instagram"
            className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-pill border border-on-dark/20 text-on-dark/80 transition-colors hover:bg-on-dark/10 hover:text-on-dark fb-focus"
          >
            <Instagram className="h-5 w-5" />
          </Link>
        </div>

        {footerNav.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-mono text-eyebrow uppercase text-sage">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-on-dark/75 transition-colors hover:text-on-dark fb-focus rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-14 border-t border-on-dark/15 pt-8">
        {/* TODO: replace with real legal entity, company number and registered address */}
        <p className="font-mono text-xs leading-relaxed text-on-dark/55">
          FASTBIRD — [Company name], Company No. [____], [registered address],
          support@myfastbird.com
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-on-dark/55">
            © 2026 FastBird. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <li
                key={method}
                className="rounded-sm border border-on-dark/15 bg-on-dark/5 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.04em] text-on-dark/60"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  </footer>
);

export default Footer;
