import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { Container, Logo } from "@/components/fastbird";
import { footerNav } from "@/constants/nav";

const Footer = () => (
  <footer className="bg-surface/90 text-ink-soft border-t border-line">
    <Container className="py-16 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-soft/70">
            Travel data that just works — top up, tap, and you&apos;re online in
            minutes.
          </p>
          <Link
            href="https://instagram.com"
            aria-label="FastBird on Instagram"
            className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-pill border border-line text-ink-soft transition-colors hover:bg-sand hover:text-ink fb-focus"
          >
            <Instagram className="h-5 w-5" />
          </Link>
        </div>

        {footerNav
          .filter((col) => col.title !== "Account")
          .map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="font-mono text-eyebrow uppercase text-ink">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft transition-colors hover:text-ink fb-focus rounded-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
      </div>

      <div className="mt-14 border-t border-line pt-8">
        {/* TODO: replace with real legal entity, company number and registered address */}
        <p className="font-mono text-xs leading-relaxed text-ink-soft/55">
          FASTBIRD — [Company name], Company No. [____], [registered address],
          support@myfastbird.com
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-ink-soft/55">
            © 2026 FastBird. All rights reserved.
          </p>
          <Image
            src="/cards.png"
            alt="Accepted payment methods"
            width={180}
            height={28}
            className="h-7 w-auto object-contain"
          />
        </div>
      </div>
    </Container>
  </footer>
);

export default Footer;
