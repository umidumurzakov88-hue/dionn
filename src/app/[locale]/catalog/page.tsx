import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCategories, getProducts } from '@/lib/data';
import { getDict, isLocale } from '@/i18n/config';
import { tr, type Locale } from '@/lib/types';
import { ProductGrid } from '@/components/shop/product-grid';
import { CatalogFilters, CatalogSort } from '@/components/shop/catalog-filters';

type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }): Promise<Metadata> {
  const { locale: l } = await params;
  const locale = (isLocale(l) ? l : 'ru') as Locale;
  const sp = await searchParams;
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === sp.category);
  return { title: cat ? tr(cat, 'name', locale) : getDict(locale).catalog.title };
}

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }) {
  const { locale: l } = await params;
  const locale = (isLocale(l) ? l : 'ru') as Locale;
  const t = getDict(locale);
  const sp = await searchParams;

  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === sp.category);
  const parent = cat?.parent_id ? categories.find((c) => c.id === cat.parent_id) : null;
  const products = await getProducts({
    category: sp.category,
    q: sp.q,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    inStock: sp.stock === '1',
    sale: sp.sale === '1',
    sort: (sp.sort as 'new' | 'cheap' | 'expensive') ?? 'popular',
  });

  const title = sp.q ? `${t.catalog.searchFor}: «${sp.q}»` : cat ? tr(cat, 'name', locale) : t.catalog.title;
  const subcats = cat ? categories.filter((c) => c.parent_id === cat.id) : [];

  return (
    <div className="container-x py-6 sm:py-10">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href={`/${locale}`} className="hover:text-fg">
          {t.common.home}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/catalog`} className="hover:text-fg">
          {t.common.catalog}
        </Link>
        {parent && (
          <>
            <span>/</span>
            <Link href={`/${locale}/catalog?category=${parent.slug}`} className="hover:text-fg">
              {tr(parent, 'name', locale)}
            </Link>
          </>
        )}
        {cat && (
          <>
            <span>/</span>
            <span className="text-fg">{tr(cat, 'name', locale)}</span>
          </>
        )}
      </nav>

      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>

      {subcats.length > 0 && (
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
          {subcats.map((c) => (
            <Link key={c.id} href={`/${locale}/catalog?category=${c.slug}`} className="shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-fg">
              {tr(c, 'name', locale)}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <Suspense>
          <div className="contents">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <div className="flex items-center justify-between gap-3 lg:block">
                <CatalogFilters categories={categories} />
                <div className="lg:hidden">
                  <CatalogSort />
                </div>
              </div>
            </div>
          </div>
        </Suspense>

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {t.catalog.found}: <span className="font-semibold text-fg">{products.length}</span>
            </p>
            <div className="hidden lg:block">
              <Suspense>
                <CatalogSort />
              </Suspense>
            </div>
          </div>
          {products.length ? (
            <ProductGrid products={products} cols={3} />
          ) : (
            <div className="card grid place-items-center px-6 py-20 text-center">
              <p className="text-lg font-semibold">{t.catalog.nothing}</p>
              <Link href={`/${locale}/catalog`} className="btn-outline mt-5">
                {t.catalog.reset}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
