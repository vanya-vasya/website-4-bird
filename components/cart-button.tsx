"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

// Cart button with a live item-count badge; the cart itself is a global
// drawer (see CartProvider / CartDrawer in the root layout).
export const CartButton = () => {
  const { count, hydrated, setOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Cart — ${hydrated ? count : 0} item${count === 1 ? "" : "s"}`}
      className="relative flex items-center rounded-full p-2.5 text-ink-soft transition-colors hover:bg-sand hover:text-ink fb-focus"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {hydrated && count > 0 && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-green px-1 font-mono text-[10px] font-semibold text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
};