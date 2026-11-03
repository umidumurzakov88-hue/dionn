import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { getProductBySlug, getProducts, getReviews } from '@/lib/data';
import { getDict, isLocale } from '@/i18n/config';
import { tr, type Locale } from '@/lib/types';
import { ProductView } from '@/components/shop/product-view';
import { ProductRail } from '@/components/shop/product-rail';
import { ReviewForm } from '@/components/shop/review-form';
import { formatDate } from '@/lib/format';

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = (isLocale(l) ? l : 'ru') as Locale;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const description = tr(p, 'description', locale).slice(0, 160);
  return { title: tr(p, 'name', locale), description, openGraph: { images: p.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { locale: l, slug } = await params;
  const locale = (isLocale(l) ? l : 'ru') as Locale;
  const t = getDict(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, similar] = await Promise.all([
    getReviews(product.id),
    product.categories ? getProducts({ category: product.categories.slug, excludeId: product.id, limit: 8 }) : Promise.resolve([]),
  ]);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const description = tr(product, 'description', locale);

  return (
    <>
      <div className="container-x py-6 sm:py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <Link href={`/${locale}`} className="hover:text-fg">
            {t.common.home}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/catalog`} className="hover:text-fg">
            {t.common.catalog}
          </Link>
          {product.categories && (
            <>
              <span>/</span>
              <Link href={`/${locale}/catalog?category=${product.categories.slug}`} className="hover:text-fg">
                {tr(product.categories, 'name', locale)}
              </Link>
            </>
          )}
        </nav>

        <ProductView product={product} />

        <div className="mt-16 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-10">
            {description && (
              <section>
                <h2 className="mb-4 text-xl font-bold">{t.product.description}</h2>
                <div className="space-y-3 leading-relaxed text-muted">
                  {description.split(/\n+/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            )}
            {product.specs.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold">{t.product.specs}</h2>
                <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
                  {product.specs.map((s, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4 px-5 py-3 text-sm">
                      <dt className="text-muted">{s[locale] || s.ru}</dt>
                      <dd className="font-medium">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {t.product.reviews} <span className="text-muted">({reviews.length})</span>
              </h2>
              {avg > 0 && (
                <span className="flex items-center gap-1 font-bold">
                  <Star className="size-5 fill-accent text-accent" /> {avg.toFixed(1)}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {reviews.length === 0 && <p className="text-sm text-muted">{t.product.noReviews}</p>}
              {reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.name}</span>
                    <span className="text-xs text-muted">{formatDate(r.created_at, locale, false)}</span>
                  </div>
                  <div className="mt-1 flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className={`size-3.5 ${k < r.rating ? 'fill-current' : 'opacity-30'}`} />
                    ))}
                  </div>
                  <p className="mt-2 text-sm">{r.text}</p>
                </div>
              ))}
              <ReviewForm productId={product.id} slug={product.slug} />
            </div>
          </section>
        </div>
      </div>
      <ProductRail title={t.product.similar} products={similar} />
    </>
  );
}
