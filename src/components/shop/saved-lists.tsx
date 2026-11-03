'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BarChart3, Heart, X } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { useHydrated, useShop } from '@/store/shop';
import { tr, type Product } from '@/lib/types';
import { unitPrice } from '@/lib/format';
import { ProductGrid } from './product-grid';
import { Price } from './price';
import { StockBadge } from './stock-badge';

function useProducts(ids: string[], ready: boolean) {
  const key = ids.join(',');
  const [result, setResult] = useState<{ key: string; items: Product[] } | null>(null);
  useEffect(() => {
    if (!ready || !key) return;
    let cancelled = false;
    fetch(`/api/products?ids=${key}`)
      .then((r) => r.json())
      .then((list: Product[]) => {
        if (cancelled) return;
        setResult({ key, items: key.split(',').map((id) => list.find((p) => p.id === id)).filter(Boolean) as Product[] });
      });
    return () => {
      cancelled = true;
    };
  }, [key, ready]);
  if (!ready) return null;
  if (!key) return [];
  // Keep showing the previous list while a removal re-fetches, filtered to current ids
  if (!result) return null;
  return result.items.filter((p) => ids.includes(p.id));
}

function Empty({ icon: Icon, text }: { icon: typeof Heart; text: string }) {
  const { t, locale } = useI18n();
  return (
    <div className="card grid place-items-center px-6 py-20 text-center">
      <Icon className="size-14 text-muted" strokeWidth={1.2} />
      <p className="mt-4 text-lg font-semibold">{text}</p>
      <Link href={`/${locale}/catalog`} className="btn-primary mt-6">
        {t.cart.goCatalog}
      </Link>
    </div>
  );
}

export function FavoritesView() {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const ids = useShop((s) => s.favorites);
  const items = useProducts(ids, hydrated);
  if (!items) return <div className="h-64" />;
  if (!items.length) return <Empty icon={Heart} text={t.fav.empty} />;
  return <ProductGrid products={items} />;
}

export function CompareView() {
  const { t, locale } = useI18n();
  const hydrated = useHydrated();
  const ids = useShop((s) => s.compare);
  const { toggleCompare, clearCompare } = useShop.getState();
  const items = useProducts(ids, hydrated);
  if (!items) return <div className="h-64" />;
  if (!items.length) return <Empty icon={BarChart3} text={t.compare.empty} />;

  // Union of all spec labels across compared products
  const labels: { ru: string; uz: string; en: string }[] = [];
  items.forEach((p) =>
    p.specs.forEach((s) => {
      if (!labels.some((l) => l.ru === s.ru)) labels.push({ ru: s.ru, uz: s.uz, en: s.en });
    }),
  );

  return (
    <div>
      <button onClick={clearCompare} className="btn-ghost mb-4 text-sm text-muted">
        <X className="size-4" /> {t.compare.clear}
      </button>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="w-44 p-4 text-left align-bottom text-muted">{t.compare.param}</th>
              {items.map((p) => {
                const { price } = unitPrice(p, p.product_variants?.[0]);
                return (
                  <th key={p.id} className="p-4 text-left align-top font-normal">
                    <div className="relative">
                      <button onClick={() => toggleCompare(p.id)} className="absolute right-0 top-0 z-10 rounded-full bg-surface p-1 shadow" aria-label="remove">
                        <X className="size-4" />
                      </button>
                      <Link href={`/${locale}/product/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-surface-2">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="200px" className="object-cover" />}
                      </Link>
                      <Link href={`/${locale}/product/${p.slug}`} className="mt-3 line-clamp-2 block font-semibold hover:text-accent">
                        {tr(p, 'name', locale)}
                      </Link>
                      <Price value={price} className="mt-1 block text-base font-bold" />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="p-4 text-muted">{t.account.status}</td>
              {items.map((p) => (
                <td key={p.id} className="p-4">
                  <StockBadge status={p.stock_status} />
                </td>
              ))}
            </tr>
            {labels.map((l) => (
              <tr key={l.ru}>
                <td className="p-4 text-muted">{l[locale] || l.ru}</td>
                {items.map((p) => (
                  <td key={p.id} className="p-4 font-medium">
                    {p.specs.find((s) => s.ru === l.ru)?.value ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
