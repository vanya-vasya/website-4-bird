import Link from "next/link";
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

      <div className="mt-14 pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-ink-soft/55">
            © 2026 FastBird. All rights reserved.
          </p>
        </div>
      </div>
    </Container>
  </footer>
);

export default Footer;
