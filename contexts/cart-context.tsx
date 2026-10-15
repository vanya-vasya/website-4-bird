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
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (item: CartItem) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const STORAGE_KEY = "fastbird-cart";

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);

  // Load once after mount so SSR and the first client render agree
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (x) =>
              x &&
              typeof x.destinationSlug === "string" &&
              typeof x.planId === "string"
          )
        ) {
          setItems(parsed as CartItem[]);
        }
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

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((item: CartItem) => {
    setItems((prev) =>
      prev.filter(
        (x) =>
          !(x.destinationSlug === item.destinationSlug && x.planId === item.planId)
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        hydrated,
        addItem,
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