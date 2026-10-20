"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  destinationSlug: string;
  planId: string;
  // Number of eSIMs of this plan in the cart (1..100 per line)
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  /** Total number of eSIMs in the cart (badge value) */
  count: number;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  setItemQty: (item: Omit<CartItem, "qty">, qty: number) => void;
  removeItem: (item: Omit<CartItem, "qty">) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const STORAGE_KEY = "fastbird-cart";

const MAX_QTY_PER_LINE = 100;

const clampQty = (qty: number) =>
  Math.min(MAX_QTY_PER_LINE, Math.max(1, Math.round(qty) || 1));

const CartContext = createContext<CartContextValue | null>(null);

// Old carts stored lines without a qty (and possibly duplicate lines) —
// normalize them to one merged line per plan with a qty
const normalizeCart = (raw: unknown): CartItem[] => {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, CartItem>();
  for (const x of raw) {
    if (
      !x ||
      typeof x.destinationSlug !== "string" ||
      typeof x.planId !== "string"
    ) {
      continue;
    }
    const key = `${x.destinationSlug}::${x.planId}`;
    const qty = clampQty(typeof x.qty === "number" ? x.qty : 1);
    const existing = merged.get(key);
    if (existing) {
      existing.qty = clampQty(existing.qty + qty);
    } else {
      merged.set(key, {
        destinationSlug: x.destinationSlug,
        planId: x.planId,
        qty,
      });
    }
  }
  return Array.from(merged.values());
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);

  // Load once after mount so SSR and the first client render agree
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setItems(normalizeCart(JSON.parse(raw)));
      }
    } catch {
      // corrupted storage — start empty
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable (private mode) — cart lives for the session only
    }
  }, [items, hydrated]);

  // Same plan merges into one line: the line's qty grows by the added qty
  const addItem = useCallback((item: { destinationSlug: string; planId: string; qty?: number }) => {
    const addQty = clampQty(item.qty ?? 1);
    setItems((prev) => {
      const existing = prev.find(
        (x) =>
          x.destinationSlug === item.destinationSlug && x.planId === item.planId
      );
      if (existing) {
        return prev.map((x) =>
          x === existing ? { ...x, qty: clampQty(x.qty + addQty) } : x
        );
      }
      return [...prev, { ...item, qty: addQty }];
    });
  }, []);

  const setItemQty = useCallback(
    (item: { destinationSlug: string; planId: string }, qty: number) => {
      setItems((prev) =>
        prev.flatMap((x) => {
          if (
            x.destinationSlug !== item.destinationSlug ||
            x.planId !== item.planId
          ) {
            return [x];
          }
          // qty 0 removes the line
          return qty < 1 ? [] : [{ ...x, qty: clampQty(qty) }];
        })
      );
    },
    []
  );

  const removeItem = useCallback((item: { destinationSlug: string; planId: string }) => {
    setItems((prev) =>
      prev.filter(
        (x) =>
          !(
            x.destinationSlug === item.destinationSlug &&
            x.planId === item.planId
          )
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        hydrated,
        addItem,
        setItemQty,
        removeItem,
        clear,
        isOpen,
        setOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};