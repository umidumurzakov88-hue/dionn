'use client';
import { useI18n } from '@/i18n/provider';
import { useHydrated, useShop } from '@/store/shop';
import { formatPrice } from '@/lib/format';

/** Renders a UZS amount in the visitor's selected currency. */
export function Price({ value, className }: { value: number; className?: string }) {
  const { locale, usdRate } = useI18n();
  const currency = useShop((s) => s.currency);
  const hydrated = useHydrated();
  return <span className={className}>{formatPrice(value, hydrated ? currency : 'UZS', usdRate, locale)}</span>;
}
