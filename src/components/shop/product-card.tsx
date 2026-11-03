'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BarChart3, Heart, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { useHydrated, useShop } from '@/store/shop';
import { tr, type Product } from '@/lib/types';
import { discountPercent, unitPrice } from '@/lib/format';
import { Price } from './price';
import { toast } from '@/components/ui/toast';
import { StockBadge } from './stock-badge';

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const isFav = useShop((s) => s.favorites.includes(product.id));
  const isCmp = useShop((s) => s.compare.includes(product.id));
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const toggleCompare = useShop((s) => s.toggleCompare);
  const addToCart = useShop((s) => s.addToCart);

  const href = `/${locale}/product/${product.slug}`;
  const variants = product.product_variants ?? [];
  const firstVariant = variants[0] ?? null;
  const { price, oldPrice } = unitPrice(product, firstVariant);
  const pct = discountPercent(price, oldPrice);
  const name = tr(product, 'name', locale);
  const colors = variants.filter((v) => v.color_hex);

  const quickAdd = () => {
    if (variants.length > 1) {
      // Product has options → let the customer choose on the product page.
      router.push(href);
      return;
    }
    addToCart({
      productId: product.id,
      variantId: firstVariant?.id ?? null,
      slug: product.slug,
      name: { ru: product.name_ru, uz: product.name_uz, en: product.name_en },
      variantName: firstVariant ? { ru: firstVariant.name_ru, uz: firstVariant.name_uz, en: firstVariant.name_en } : null,
      image: firstVariant?.image ?? product.images[0] ?? null,
      price,
    });
    toast.ok(t.product.addedToCart);
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-xl hover:shadow-black/5">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-surface-2">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        {product.images[1] && (
          <Image
            src={product.images[1]}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {pct > 0 && <span className="chip bg-danger text-white">−{pct}%</span>}
          {product.is_new && <span className="chip bg-primary text-primary-fg">{t.product.new}</span>}
          {product.is_hit && <span className="chip bg-accent text-white">{t.product.hit}</span>}
        </div>
      </Link>

      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button
          onClick={() => toggleFavorite(product.id)}
          aria-label={t.common.favorites}
          className={`grid size-9 place-items-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:scale-110 ${
            hydrated && isFav ? 'text-danger' : ''
          }`}
        >
          <Heart className={`size-[18px] ${hydrated && isFav ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={() => {
            toggleCompare(product.id);
            if (!isCmp) toast.ok(t.compare.added);
          }}
          aria-label={t.common.compare}
          className={`grid size-9 place-items-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:scale-110 ${
            hydrated && isCmp ? 'text-accent' : ''
          }`}
        >
          <BarChart3 className="size-[18px]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <StockBadge status={product.stock_status} />
          {colors.length > 1 && (
            <div className="flex -space-x-1">
              {colors.slice(0, 5).map((v) => (
                <span key={v.id} className="size-4 rounded-full border-2 border-surface" style={{ background: v.color_hex! }} />
              ))}
            </div>
          )}
        </div>
        <Link href={href} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-accent sm:text-[15px]">
          {name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-col">
            {oldPrice && <Price value={oldPrice} className="text-xs text-muted line-through" />}
            <Price value={price} className={`text-base font-bold sm:text-lg ${oldPrice ? 'text-danger' : ''}`} />
          </div>
          <button
            onClick={quickAdd}
            disabled={product.stock_status === 'out_of_stock'}
            aria-label={t.product.addToCart}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg transition hover:opacity-85 disabled:opacity-40"
          >
            <ShoppingBag className="size-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
