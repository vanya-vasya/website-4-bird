"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap, LogOut, Settings } from "lucide-react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { Button, Container, Logo } from "@/components/fastbird";
import { mainNav } from "@/constants/nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";

const UserMenu = () => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  const initials =
    `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`.toUpperCase() ||
    user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() ||
    "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full fb-focus outline-none"
          aria-label="User menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "User"} />
            <AvatarFallback className="bg-ink-soft/20 text-ink font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4 text-ink-soft" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 mt-1">
        <DropdownMenuLabel className="font-normal">
          <p className="font-semibold text-sm text-ink leading-tight">
            {user?.fullName ?? user?.firstName ?? "User"}
          </p>
          <p className="text-xs text-ink-soft mt-0.5 truncate">
            {user?.emailAddresses[0]?.emailAddress}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => openUserProfile()}
          className="cursor-pointer gap-2"
        >
          <Settings className="h-4 w-4 text-ink-soft" aria-hidden />
          Manage account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ redirectUrl: "/" })}
          className="cursor-pointer gap-2 text-red-500 focus:text-red-500"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Header = () => {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/generations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCredits(d.remaining ?? 0))
      .catch(() => {});
  }, [isSignedIn]);

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
          {isLoaded && isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                aria-label={`${credits} credits — go to dashboard`}
                className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-surface transition-opacity hover:opacity-80 fb-focus"
              >
                <Zap className="h-4 w-4 fill-surface" aria-hidden />
                <span className="font-semibold text-sm">{credits}</span>
                <span className="text-sm font-normal opacity-70">credits</span>
              </Link>
              <UserMenu />
            </>
          ) : isLoaded ? (
            <>
              <Link
                href="/sign-in"
                className="font-mono text-eyebrow uppercase underline-offset-4 transition-colors hover:underline fb-focus rounded-sm text-green"
              >
                Log in
              </Link>
              <Button href="/sign-up" variant="accent" size="sm">
                Get started
              </Button>
            </>
          ) : null}
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
              {isLoaded && isSignedIn ? (
                <Button href="/dashboard" variant="accent" size="lg">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button href="/sign-up" variant="accent" size="lg">
                    Get started
                  </Button>
                  <Button href="/sign-in" variant="secondary" size="lg">
                    Log in
                  </Button>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
};

export default Header;
