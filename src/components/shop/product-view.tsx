'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { BarChart3, Check, Heart, Minus, Plus, ShieldCheck, Truck, Wrench, Zap } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { useHydrated, useShop } from '@/store/shop';
import { tr, type Product, type Variant } from '@/lib/types';
import { discountPercent, unitPrice } from '@/lib/format';
import { Price } from './price';
import { StockBadge } from './stock-badge';
import { ProductGallery } from './product-gallery';
import { CallbackModal } from './callback-modal';
import { toast } from '@/components/ui/toast';

export function ProductView({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const variants = useMemo(() => product.product_variants ?? [], [product.product_variants]);
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [quick, setQuick] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const { price, oldPrice } = unitPrice(product, variant);
  const pct = discountPercent(price, oldPrice);
  const name = tr(product, 'name', locale);

  const isFav = useShop((s) => s.favorites.includes(product.id));
  const isCmp = useShop((s) => s.compare.includes(product.id));
  const inCart = useShop((s) => s.cart.some((l) => l.key === `${product.id}:${variantId ?? ''}`));
  const { addToCart, toggleFavorite, toggleCompare } = useShop.getState();

  const groups = useMemo(() => {
    const m = new Map<string, Variant[]>();
    variants.forEach((v) => m.set(v.group_name, [...(m.get(v.group_name) ?? []), v]));
    return [...m.entries()];
  }, [variants]);

  const groupLabel = (g: string) =>
    ({ color: t.product.color, size: t.product.size, material: t.product.material } as Record<string, string>)[g] ?? t.product.option;

  const add = (goToCart: boolean) => {
    addToCart(
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        slug: product.slug,
        name: { ru: product.name_ru, uz: product.name_uz, en: product.name_en },
        variantName: variant ? { ru: variant.name_ru, uz: variant.name_uz, en: variant.name_en } : null,
        image: variant?.image ?? product.images[0] ?? null,
        price,
      },
      qty,
    );
    if (goToCart) router.push(`/${locale}/cart`);
    else toast.ok(t.product.addedToCart);
  };

  const disabled = product.stock_status === 'out_of_stock';

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ProductGallery images={product.images} alt={name} activeImage={variant?.image} />

      <div>
        <div className="flex flex-wrap items-center gap-2">
          {pct > 0 && <span className="chip bg-danger text-white">−{pct}%</span>}
          {product.is_new && <span className="chip bg-primary text-primary-fg">{t.product.new}</span>}
          {product.is_hit && <span className="chip bg-accent text-white">{t.product.hit}</span>}
          <StockBadge status={product.stock_status} />
        </div>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{name}</h1>
        {(variant?.sku || product.sku) && (
          <p className="mt-2 text-sm text-muted">
            {t.product.sku}: {variant?.sku || product.sku}
          </p>
        )}

        <div className="mt-6 flex items-end gap-3">
          <Price value={price} className={`text-3xl font-extrabold ${oldPrice ? 'text-danger' : ''}`} />
          {oldPrice && <Price value={oldPrice} className="pb-1 text-lg text-muted line-through" />}
        </div>
        {product.installment && (
          <p className="mt-2 text-sm text-muted">
            {t.product.installmentFrom} <Price value={Math.ceil(price / 12)} className="font-semibold text-fg" />
            {t.product.perMonth}
          </p>
        )}

        {groups.map(([g, list]) => (
          <div key={g} className="mt-6">
            <p className="mb-2.5 text-sm font-semibold">
              {groupLabel(g)}: <span className="font-normal text-muted">{variant?.group_name === g ? tr(variant, 'name', locale) : t.product.choose}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {list.map((v) =>
                v.color_hex ? (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    title={tr(v, 'name', locale)}
                    className={`relative grid size-11 place-items-center rounded-full border-2 transition ${v.id === variantId ? 'border-fg' : 'border-border hover:border-muted'}`}
                  >
                    <span className="size-8 rounded-full border border-black/10" style={{ background: v.color_hex }} />
                    {v.id === variantId && <Check className="absolute size-4 text-white mix-blend-difference" />}
                  </button>
                ) : (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition ${v.id === variantId ? 'border-fg' : 'border-border hover:border-muted'}`}
                  >
                    {tr(v, 'name', locale)}
                  </button>
                ),
              )}
            </div>
          </div>
        ))}

        <div className="mt-8 flex flex-wrap gap-3">
          <div className="flex h-12 items-center rounded-xl border border-border bg-surface">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-full w-11 place-items-center hover:text-accent" aria-label="-">
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center font-semibold">{qty}</span>
            <button onClick={() => setQty(Math.min(99, qty + 1))} className="grid h-full w-11 place-items-center hover:text-accent" aria-label="+">
              <Plus className="size-4" />
            </button>
          </div>
          <button disabled={disabled} onClick={() => add(false)} className="btn-outline h-12 flex-1">
            {hydrated && inCart ? (
              <>
                <Check className="size-4" /> {t.product.inCart}
              </>
            ) : (
              t.product.addToCart
            )}
          </button>
          <button disabled={disabled} onClick={() => add(true)} className="btn-primary h-12 flex-1">
            {t.product.buy}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setQuick(true)} className="btn-ghost text-sm">
            <Zap className="size-4 text-accent" /> {t.product.quickOrder}
          </button>
          <button onClick={() => toggleFavorite(product.id)} className={`btn-ghost text-sm ${hydrated && isFav ? 'text-danger' : ''}`}>
            <Heart className={`size-4 ${hydrated && isFav ? 'fill-current' : ''}`} /> {t.common.favorites}
          </button>
          <button
            onClick={() => {
              toggleCompare(product.id);
              if (!isCmp) toast.ok(t.compare.added);
            }}
            className={`btn-ghost text-sm ${hydrated && isCmp ? 'text-accent' : ''}`}
          >
            <BarChart3 className="size-4" /> {t.common.compare}
          </button>
        </div>

        <ul className="mt-8 grid gap-3 rounded-2xl bg-surface-2 p-5 text-sm sm:grid-cols-3">
          <li className="flex items-center gap-2.5">
            <Truck className="size-5 shrink-0 text-accent" /> {t.product.freeDelivery}
          </li>
          <li className="flex items-center gap-2.5">
            <ShieldCheck className="size-5 shrink-0 text-accent" /> {t.product.warranty}
          </li>
          <li className="flex items-center gap-2.5">
            <Wrench className="size-5 shrink-0 text-accent" /> {t.product.assembly}
          </li>
        </ul>

        {product.categories && (
          <p className="mt-6 text-sm text-muted">
            {t.catalog.categories}:{' '}
            <Link href={`/${locale}/catalog?category=${product.categories.slug}`} className="font-medium text-fg underline-offset-2 hover:underline">
              {tr(product.categories, 'name', locale)}
            </Link>
          </p>
        )}
      </div>

      <CallbackModal
        open={quick}
        onClose={() => setQuick(false)}
        productId={product.id}
        productName={variant ? `${name} — ${tr(variant, 'name', locale)}` : name}
      />
    </div>
  );
}
