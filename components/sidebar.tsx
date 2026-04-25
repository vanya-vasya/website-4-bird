"use client";

import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { FreeCounter } from "@/components/free-counter";
import { UserButton } from "@clerk/nextjs";

import { tools } from "@/constants";

const poppins = Montserrat({ weight: "600", subsets: ["latin"] });

interface SidebarProps {
  apiUsedGenerations: number;
  apiAvailableGenerations: number;
}

export const Sidebar = ({
  apiUsedGenerations = 0,
  apiAvailableGenerations = 0,
}: SidebarProps) => {
  const pathname = usePathname();

  return (
    <div className="py-4 flex flex-col h-full bg-white text-white border-r border-white/10 overflow-y-auto sidebar overflow-x-hidden">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <Image
            width={"150"}
            height={"60"}
            className="mr-4"
            alt="Logo"
            src="/logos/yum-mi-onigiri-logo.png"
          />
        </Link>
        <div className="space-y-1">
          {tools.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href
                  ? "text-white bg-white/10"
                  : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="text-sm group flex w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-white sidebarClerkButton">
          <UserButton
            afterSignOutUrl="/"
            showName
            appearance={{
              elements: {
                userButtonPopoverCard: {
                  zIndex: 99999,
                  overflow: "visible",
                },
                userButtonPopoverMain: {
                  display: "flex",
                  flexDirection: "column",
                },
                userPreview: {
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                },
                userPreviewTextContainer: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "4px",
                },
                userPreviewMainIdentifier: {
                  position: "static",
                  display: "block",
                },
                userPreviewSecondaryIdentifier: {
                  position: "static",
                  display: "block",
                },
                userButtonPopoverActions: {
                  display: "flex",
                  flexDirection: "column",
                  position: "static",
                },
                userButtonPopoverActionButton: {
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  position: "static",
                },
              },
            }}
          />
        </div>
      </div>
      <FreeCounter
        apiUsedGenerations={apiUsedGenerations}
        apiAvailableGenerations={apiAvailableGenerations}
      />
    </div>
  );
};
