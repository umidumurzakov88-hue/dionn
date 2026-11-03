import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

/** Horizontal, swipeable row of products on mobile; grid on desktop. */
export function ProductRail({ title, href, linkLabel, products }: { title: string; href?: string; linkLabel?: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="container-x mt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="section-title">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg">
            {linkLabel} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.slice(0, products.length >= 8 ? 8 : products.length >= 4 ? 4 : products.length).map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
