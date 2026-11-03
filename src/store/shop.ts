'use client';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency } from '@/lib/types';

export interface CartLine {
  key: string; // productId:variantId
  productId: string;
  variantId: string | null;
  slug: string;
  name: { ru: string; uz: string; en: string };
  variantName: { ru: string; uz: string; en: string } | null;
  image: string | null;
  price: number; // UZS — display only; the server recalculates on checkout
  qty: number;
}

interface ShopState {
  cart: CartLine[];
  favorites: string[]; // product ids
  compare: string[];
  currency: Currency;
  promo: string | null;
  addToCart: (line: Omit<CartLine, 'key' | 'qty'>, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  setCurrency: (c: Currency) => void;
  setPromo: (c: string | null) => void;
}

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      favorites: [],
      compare: [],
      currency: 'UZS',
      promo: null,
      addToCart: (line, qty = 1) =>
        set((s) => {
          const key = `${line.productId}:${line.variantId ?? ''}`;
          const existing = s.cart.find((l) => l.key === key);
          if (existing) {
            return { cart: s.cart.map((l) => (l.key === key ? { ...l, qty: Math.min(99, l.qty + qty) } : l)) };
          }
          return { cart: [...s.cart, { ...line, key, qty }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({ cart: s.cart.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l)) })),
      removeFromCart: (key) => set((s) => ({ cart: s.cart.filter((l) => l.key !== key) })),
      clearCart: () => set({ cart: [], promo: null }),
      toggleFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] })),
      toggleCompare: (id) =>
        set((s) => ({
          compare: s.compare.includes(id) ? s.compare.filter((f) => f !== id) : [...s.compare, id].slice(-4),
        })),
      clearCompare: () => set({ compare: [] }),
      setCurrency: (currency) => set({ currency }),
      setPromo: (promo) => set({ promo }),
    }),
    { name: 'dionn-shop' },
  ),
);

/** Avoids hydration mismatch: returns false on the server and first client render. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
