"use client";
import Link from "next/link";
import Image from "next/image";
import { GuestMobileSidebar } from "@/components/guest-mobile-sidebar";
import { UsageProgress } from "@/components/usage-progress";
import { UserButton } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRODUCT_ITEMS } from "@/constants/product-navigation";
import { ProductIcon } from "@/components/shared/ProductIcon";

const routes = [
  {
    name: "Our Story",
    href: "/story",
  },
  {
    name: "Pricing",
    href: "/#pricing",
  },
  {
    name: "FAQ",
    href: "/faq",
  },
  {
    name: "Contact",
    href: "/contact",
  },
  {
    name: "Payment History",
    href: "/dashboard/billing/payment-history",
  },
];

interface DashboardHeaderProps {
  initialUsedGenerations: number;
  initialAvailableGenerations: number;
}

const DashboardHeader = ({ initialUsedGenerations, initialAvailableGenerations }: DashboardHeaderProps) => {
  return (
    <header className="bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-3 lg:px-6 gap-1">
        <div className="flex">
          <Link href="/dashboard" className="-m-1.5 p-1.5">
            <Image width={98} height={39} src="/logos/yum-mi-onigiri-logo.png" alt="Yum-mi Logo"/>
          </Link>
        </div>
        <div className="flex gap-x-12 ml-12">
          <div className="nav-container-light-green">
            <Link
              href="/"
              className="nav-link"
            >
              Home
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="nav-link flex items-center gap-1 outline-none">
                Products
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="bg-white border border-green-100 shadow-lg min-w-[240px] p-1"
              >
                {PRODUCT_ITEMS.map((product) => (
                  <DropdownMenuItem 
                    key={product.href} 
                    asChild
                    className="focus:bg-transparent focus:text-inherit hover:bg-transparent data-[highlighted]:bg-transparent"
                  >
                    <Link 
                      href={product.href}
                      className="dropdown-menu-item flex items-center gap-3 w-full"
                    >
                      <ProductIcon 
                        icon={product.icon}
                        iconUrl={product.iconUrl}
                        fallback={product.iconFallback}
                        alt={product.label}
                        size={20}
                      />
                      <span className="flex-1">{product.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {routes.map((route) => (
              <Link
                key={route.name}
                href={route.href}
                className="nav-link"
                aria-label={`Navigate to ${route.name}`}
              >
                {route.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex lg:flex-1 lg:justify-end">
          <div className="flex items-center space-x-4">
            <div className="hidden md:block w-[220px]">
              <UsageProgress
                initialUsedGenerations={initialUsedGenerations}
                initialAvailableGenerations={initialAvailableGenerations}
              />
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
          <GuestMobileSidebar />
        </div>
      </nav>

      <style jsx global>{`
        :root {
          --header-font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          --header-font-size: 16px;
          --header-text-color: #000000;
          --nav-font: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          --contact-font: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .nav-container {
          display: flex;
          background-color: #f8fafc;
          border-radius: 9999px;
          padding: 4px;
          gap: 4px;
        }

        .nav-container-green {
          display: flex;
          background-color: #86efac;
          border-radius: 9999px;
          padding: 4px;
          gap: 4px;
        }

        .nav-container-light-green {
          display: flex;
          background-color: #dcfce7;
          border-radius: 9999px;
          padding: 4px;
          gap: 4px;
        }

        .nav-link {
          font-family: var(--header-font-family);
          font-weight: 600;
          font-size: var(--header-font-size);
          line-height: 1.1;
          letter-spacing: 0.01em;
          text-transform: none;
          color: var(--header-text-color);
          padding: 8px 16px;
          border-radius: 9999px;
          transition: all 500ms ease-in-out;
        }

        .main-header__login-sing-up .nav-link {
          font-family: var(--header-font-family) !important;
          font-weight: 600 !important;
          font-size: var(--header-font-size) !important;
          line-height: 1.1 !important;
          letter-spacing: 0.01em !important;
          text-transform: none !important;
          color: var(--header-text-color) !important;
          padding: 8px 16px !important;
          border-radius: 9999px !important;
          border: none !important;
        }

        .nav-link:hover,
        .nav-link:focus-visible {
          background: linear-gradient(to right, #10b981, #059669, #047857);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          text-decoration: none;
        }

        /* Ensure dropdown trigger inherits nav-link hover styles */
        button.nav-link:hover,
        button.nav-link:focus-visible,
        button.nav-link[data-state="open"] {
          background: linear-gradient(to right, #10b981, #059669, #047857);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          text-decoration: none;
        }

        /* Dropdown menu item styling - solid black text, green gradient on hover */
        .dropdown-menu-item {
          font-family: var(--header-font-family);
          font-weight: 600;
          font-size: var(--header-font-size);
          line-height: 1.1;
          letter-spacing: 0.01em;
          text-transform: none;
          color: #000000 !important;
          padding: 10px 14px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 500ms ease-in-out;
        }

        /* Override any inherited or conflicting text colors */
        .dropdown-menu-item *,
        .dropdown-menu-item span {
          color: inherit;
        }

        .dropdown-menu-item:hover,
        .dropdown-menu-item:focus-visible,
        .dropdown-menu-item:active {
          background: linear-gradient(to right, #10b981, #059669, #047857) !important;
          background-clip: text !important;
          -webkit-background-clip: text !important;
          color: transparent !important;
          text-decoration: none;
        }

        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .nav-container-light-green {
            display: none;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .dropdown-menu-item {
            color: #f1f5f9;
          }
        }

        /* Complete removal of all UserButton hover effects */
        /* Remove all visual changes on hover/focus/active states */
        .cl-userButtonTrigger,
        .cl-userButtonTrigger:hover,
        .cl-userButtonTrigger:focus,
        .cl-userButtonTrigger:active,
        .cl-userButtonTrigger:focus-visible {
          background-color: transparent !important;
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
          scale: 1 !important;
          opacity: 1 !important;
          filter: none !important;
          outline: none !important;
          border: none !important;
          transition: none !important;
          cursor: pointer !important;
        }

        /* Remove hover effects from UserButton container */
        .cl-userButtonBox,
        .cl-userButtonBox:hover,
        .cl-userButtonBox:focus,
        .cl-userButtonBox:active {
          background-color: transparent !important;
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
          transition: none !important;
        }

        /* Remove hover effects from Clerk data attributes */
        [data-clerk-element="userButton"],
        [data-clerk-element="userButton"]:hover,
        [data-clerk-element="userButton"]:focus,
        [data-clerk-element="userButton"]:active {
          background-color: transparent !important;
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
          transition: none !important;
        }

        /* Remove hover effects from avatar image */
        .cl-userButtonAvatarBox,
        .cl-userButtonAvatarBox:hover,
        .cl-userButtonAvatarBox img,
        .cl-userButtonAvatarBox:hover img {
          transform: none !important;
          scale: 1 !important;
          filter: none !important;
          opacity: 1 !important;
          transition: none !important;
        }

        /* Ensure no hover effects on any Clerk user button elements */
        [class*="cl-userButton"]:hover,
        [class*="cl-userButton"]:focus,
        [class*="cl-userButton"]:active {
          background-color: transparent !important;
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
          transition: none !important;
        }

      `}</style>
    </header>
  );
};

export default DashboardHeader;

