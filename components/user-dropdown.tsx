"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, LogOut } from "lucide-react";

export const UserDropdown = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    await signOut();
    router.push("/");
  }, [signOut, router]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    if (e.key === "Escape") setOpen(false);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  if (!isLoaded || !user) return null;

  const fullName = user.fullName || user.username || "";
  const email = user.primaryEmailAddress?.emailAddress || "";
  const avatarUrl = user.imageUrl;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label="Open user menu"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 cursor-pointer select-none focus:outline-none"
      >
        <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-gray-200">
          <Image
            src={avatarUrl}
            alt={fullName || "User avatar"}
            fill
            className="object-cover"
            sizes="36px"
          />
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Popup */}
      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-[calc(100%+8px)] z-[9999] w-[280px] rounded-xl border border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)]"
        >
          {/* User info */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="relative h-11 w-11 flex-shrink-0 rounded-full overflow-hidden border-2 border-gray-200">
              <Image
                src={avatarUrl}
                alt={fullName || "User avatar"}
                fill
                className="object-cover"
                sizes="44px"
              />
            </div>
            <div className="min-w-0 flex flex-col gap-0.5">
              {fullName && (
                <p className="text-[14px] font-semibold text-[#0f172a] leading-snug truncate">
                  {fullName}
                </p>
              )}
              <p className="text-[13px] text-gray-500 leading-snug truncate">{email}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-3 py-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
            >
              <LogOut size={15} className="flex-shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
