"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PaymentHistoryAnalytics } from "@/lib/analytics";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  MessageSquare,
  FileImage,
  Wand2,
  ImageMinus,
  Scissors,
  PaintBucket,
  ArchiveRestore,
  Layers,
  Sparkles,
  ChevronDown,
  Mic,
  Coins,
  Banknote,
  Lightbulb,
  Crown,
  Activity,
  Target,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import { UsageProgress } from "./usage-progress";
import { tools } from "@/constants";







// Инструменты для контент-креаторов
const contentCreatorTools = tools.filter((tool) =>
  tool.professions.includes("content")
);

// Общие инструменты
const commonTools = tools.filter((tool) => tool.professions.includes("all"));

export function MainNav({
  initialUsedGenerations,
  initialAvailableGenerations,
}: {
  initialUsedGenerations: number;
  initialAvailableGenerations: number;
}) {
  return (
    <div className="flex items-center justify-between w-full bg-white">
      <div className="flex items-center gap-8">
        <Link
          href="/dashboard"
          className="hidden items-center space-x-2 md:flex"
        >
          <Image src="/logos/yum-mi-onigiri-logo.png" alt="Yum-mi Logo" width={98} height={39} />
        </Link>

        <NavigationMenu>
          <NavigationMenuList className="nav-container">
            <NavigationMenuItem>
              <Link href="/dashboard/conversation?toolId=master-chef">
                <div className="nav-link cursor-pointer group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 group bg-transparent">
                  <Crown className="mr-2 h-4 w-4" />
                  Your Own Chef
                </div>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/dashboard/conversation?toolId=master-nutritionist">
                <div className="nav-link cursor-pointer group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 group bg-transparent">
                  <Activity className="mr-2 h-4 w-4" />
                  Your Own Nutritionist
                </div>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/dashboard/conversation?toolId=cal-tracker">
                <div className="nav-link cursor-pointer group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 group bg-transparent">
                  <Target className="mr-2 h-4 w-4" />
                  Your Own Tracker
                </div>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link 
                href={"/dashboard/billing/payment-history"}
                onClick={() => PaymentHistoryAnalytics.clickPaymentHistoryLink('desktop_nav')}
              >
                <div className="nav-link cursor-pointer group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 group bg-transparent">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payments
                </div>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      <style jsx global>{`
        .nav-container {
          display: flex;
          background-color: #f8fafc;
          border-radius: 9999px;
          padding: 4px;
          gap: 4px;
        }

        .nav-link {
          font-family: var(--font-sans);
          font-weight: 600;
          font-size: 16px;
          line-height: 1.1;
          letter-spacing: 0.01em;
          text-transform: none;
          color: #0f172a;
          padding: 8px 16px;
          border-radius: 9999px;
          transition: all 500ms ease-in-out;
        }

        .nav-link:hover {
          background: linear-gradient(to right, #10b981, #059669, #047857);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    icon: any;
    id?: string;
  }
>(
  (
    {
      className,
      title,
      children,
      icon: Icon,
      id,
      href,
      ...props
    },
    ref
  ) => {
    // Use the ID directly as the toolId when available
    const toolId = id;

    // Construct the complete href with toolId parameter
    let fullHref = href || "";

    // Only add the toolId if it exists and the URL doesn't already have a toolId parameter
    if (toolId && href && !href.includes("?toolId=")) {
      // If the URL already has parameters, add toolId with &, otherwise with ?
      fullHref = href.includes("?")
        ? `${href}&toolId=${toolId}`
        : `${href}?toolId=${toolId}`;
    }

    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            href={fullHref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors text-black hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900",
              className
            )}
            {...props}
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 opacity-20 blur-sm"></div>
                <div className="relative bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 p-2 rounded-full backdrop-blur-sm">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-sm font-medium leading-none">{title}</div>
            </div>
            <p className="line-clamp-2 text-sm leading-snug text-gray-600">
              {children}
            </p>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";
