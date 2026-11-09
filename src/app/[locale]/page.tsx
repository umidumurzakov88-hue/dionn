import Image from 'next/image';
import Link from 'next/link';
import { BadgePercent, ShieldCheck, Star, Truck, Wrench } from 'lucide-react';
import { getCategories, getProducts, getReviews } from '@/lib/data';
import { getDict, isLocale } from '@/i18n/config';
import { tr, type Locale } from '@/lib/types';
import { HeroVideo } from '@/components/shop/hero-video';
import { ProductRail } from '@/components/shop/product-rail';
import { formatDate } from '@/lib/format';

export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  const locale = (isLocale(l) ? l : 'ru') as Locale;
  const t = getDict(locale);
  const L = (p: string) => `/${locale}${p}`;

  const [categories, newest, hits, sale, reviews] = await Promise.all([
    getCategories(),
    getProducts({ isNew: true, sort: 'new', limit: 8 }),
    getProducts({ isHit: true, limit: 8 }),
    getProducts({ sale: true, limit: 8 }),
    getReviews(undefined, 6),
  ]);
  const roots = categories.filter((c) => !c.parent_id);

  const advantages = [
    { icon: Truck, title: t.home.adv1Title, text: t.home.adv1Text },
    { icon: BadgePercent, title: t.home.adv2Title, text: t.home.adv2Text },
    { icon: ShieldCheck, title: t.home.adv3Title, text: t.home.adv3Text },
    { icon: Wrench, title: t.home.adv4Title, text: t.home.adv4Text },
  ];

  return (
    <>
      <h1 className="sr-only">{t.meta.title}</h1>
      <HeroVideo />

      <section className="container-x mt-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {advantages.map(({ icon: Icon, title }, k) => (
            <div key={title} data-reveal style={{ '--i': k } as React.CSSProperties} className="group card hover-lift flex items-center gap-3 p-4 hover:border-accent/40">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent transition duration-500 group-hover:rotate-6">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-semibold leading-tight">{title}</span>
            </div>
          ))}
        </div>
      </section>

      {roots.length > 0 && (
        <section className="container-x mt-16">
          <h2 data-reveal className="section-title mb-6">{t.home.categories}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {roots.map((c, idx) => (
              <Link
                key={c.id}
                data-reveal="scale"
                style={{ '--i': idx % 4 } as React.CSSProperties}
                href={L(`/catalog?category=${c.slug}`)}
                // Make the first few tiles double-width so the grid always fills complete rows of 4.
                className={`group relative h-44 overflow-hidden rounded-2xl bg-surface-2 sm:h-60 ${
                  idx < (4 - (roots.length % 4)) % 4 ? 'col-span-2' : ''
                }`}
              >
                {c.image && (
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(max-width:768px) 50vw, 25vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
                <span className="absolute bottom-4 left-4 right-4 text-base font-bold text-white transition-transform duration-500 group-hover:-translate-y-1 sm:text-lg">{tr(c, 'name', locale)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRail title={t.home.newArrivals} href={L('/catalog?sort=new')} linkLabel={t.common.showAll} products={newest} />
      <ProductRail title={t.home.hits} href={L('/catalog')} linkLabel={t.common.showAll} products={hits} />
      <ProductRail title={t.home.sale} href={L('/catalog?sale=1')} linkLabel={t.common.showAll} products={sale} />

      <section className="container-x mt-20">
        <div data-reveal className="grid overflow-hidden rounded-3xl bg-primary text-primary-fg lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <h2 data-reveal="left" className="section-title">{t.home.whyUs}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {advantages.map(({ icon: Icon, title, text }, k) => (
                <div key={title} data-reveal style={{ '--i': k + 1 } as React.CSSProperties} className="group">
                  <Icon className="size-7 text-accent transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110" />
                  <h3 className="mt-3 font-bold">{title}</h3>
                  <p className="mt-1 text-sm opacity-70">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="group relative min-h-[280px] overflow-hidden">
            <Image src="/demo/banner-sideboard.jpg" alt="" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover transition duration-[1.5s] ease-out group-hover:scale-105" />
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="container-x mt-20">
          <h2 data-reveal className="section-title mb-6">{t.home.reviews}</h2>
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
            {reviews.map((r, k) => (
              <figure key={r.id} data-reveal style={{ '--i': k % 3 } as React.CSSProperties} className="card hover-lift w-[80%] shrink-0 snap-start p-6 hover:shadow-xl hover:shadow-black/5 sm:w-auto">
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className={`size-4 ${k < r.rating ? 'fill-current' : 'opacity-30'}`} />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed">{r.text}</blockquote>
                <figcaption className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-xs text-muted">{formatDate(r.created_at, locale, false)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="container-x mt-20">
        <div data-reveal className="card grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_1.2fr]">
          <Image src="/brand/logo.png" alt="Dionn" width={510} height={175} className="logo-ink animate-float h-auto w-full max-w-sm" />
          <div>
            <h2 className="section-title">{t.home.aboutTitle}</h2>
            <p className="mt-4 leading-relaxed text-muted">{t.home.aboutText}</p>
            <Link href={L('/info/about')} className="btn-outline mt-6">
              {t.common.more}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
