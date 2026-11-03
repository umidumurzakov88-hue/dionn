'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { useHydrated, useShop } from '@/store/shop';
import { tr, type Category } from '@/lib/types';

export function CatalogSort() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const set = (v: string) => {
    const p = new URLSearchParams(params);
    if (v === 'popular') p.delete('sort');
    else p.set('sort', v);
    router.push(`${pathname}?${p}`);
  };
  return (
    <select value={params.get('sort') ?? 'popular'} onChange={(e) => set(e.target.value)} className="input h-10 w-auto py-0 pr-8 text-sm">
      <option value="popular">{t.catalog.sortPopular}</option>
      <option value="new">{t.catalog.sortNew}</option>
      <option value="cheap">{t.catalog.sortCheap}</option>
      <option value="expensive">{t.catalog.sortExpensive}</option>
    </select>
  );
}

export function CatalogFilters({ categories }: { categories: Category[] }) {
  const { t, locale, usdRate } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const currency = useShop((s) => s.currency);
  const hydrated = useHydrated();
  const usd = hydrated && currency === 'USD';
  const [open, setOpen] = useState(false);

  // Prices are stored in UZS; when the visitor uses USD we convert the inputs.
  const toDisplay = (v: string | null) => (v ? String(usd ? Math.round(Number(v) / usdRate) : v) : '');
  const [min, setMin] = useState(toDisplay(params.get('min')));
  const [max, setMax] = useState(toDisplay(params.get('max')));

  const activeCat = params.get('category');
  const roots = categories.filter((c) => !c.parent_id);

  const apply = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`${pathname}?${p}`);
    setOpen(false);
  };
  const toUzs = (v: string) => (v ? String(Math.round(Number(v) * (usd ? usdRate : 1))) : null);

  const catHref = (slug: string | null) => {
    const p = new URLSearchParams(params);
    if (slug) p.set('category', slug);
    else p.delete('category');
    return `${pathname}?${p}`;
  };

  const panel = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">{t.catalog.categories}</h3>
        <ul className="space-y-0.5 text-sm">
          <li>
            <Link href={catHref(null)} className={`block rounded-lg px-3 py-2 ${!activeCat ? 'bg-surface-2 font-semibold' : 'hover:bg-surface-2'}`}>
              {t.common.all}
            </Link>
          </li>
          {roots.map((c) => {
            const children = categories.filter((x) => x.parent_id === c.id);
            const isOpen = activeCat === c.slug || children.some((x) => x.slug === activeCat);
            return (
              <li key={c.id}>
                <Link href={catHref(c.slug)} className={`block rounded-lg px-3 py-2 ${activeCat === c.slug ? 'bg-surface-2 font-semibold' : 'hover:bg-surface-2'}`}>
                  {tr(c, 'name', locale)}
                </Link>
                {isOpen && children.length > 0 && (
                  <ul className="ml-3 border-l border-border pl-2">
                    {children.map((x) => (
                      <li key={x.id}>
                        <Link
                          href={catHref(x.slug)}
                          className={`block rounded-lg px-3 py-1.5 ${activeCat === x.slug ? 'font-semibold text-fg' : 'text-muted hover:text-fg'}`}
                        >
                          {tr(x, 'name', locale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
          {t.catalog.price}, {usd ? '$' : locale === 'en' ? 'UZS' : locale === 'uz' ? "so'm" : 'сум'}
        </h3>
        <div className="flex gap-2">
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} placeholder={t.catalog.from} className="input py-2.5" />
          <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} placeholder={t.catalog.to} className="input py-2.5" />
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="size-4 accent-[var(--accent)]"
            checked={params.get('stock') === '1'}
            onChange={(e) => apply({ stock: e.target.checked ? '1' : null })}
          />
          {t.catalog.onlyInStock}
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="size-4 accent-[var(--accent)]"
            checked={params.get('sale') === '1'}
            onChange={(e) => apply({ sale: e.target.checked ? '1' : null })}
          />
          {t.catalog.onlySale}
        </label>
      </div>

      <div className="flex gap-2">
        <button onClick={() => apply({ min: toUzs(min), max: toUzs(max) })} className="btn-primary flex-1">
          {t.catalog.apply}
        </button>
        <button
          onClick={() => {
            setMin('');
            setMax('');
            const q = params.get('q');
            router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
            setOpen(false);
          }}
          className="btn-outline"
        >
          {t.catalog.reset}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline h-10 py-0 lg:hidden">
        <SlidersHorizontal className="size-4" /> {t.catalog.filters}
      </button>
      <aside className="hidden lg:block">{panel}</aside>
      {open && (
        <div className="fixed inset-0 z-[80] bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="animate-fade-in ml-auto h-full w-[88%] max-w-sm overflow-y-auto bg-bg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t.catalog.filters}</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-surface-2">
                <X className="size-5" />
              </button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}
