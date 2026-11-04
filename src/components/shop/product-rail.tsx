import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

/** Horizontal, swipeable row of products on mobile; grid on desktop. */
export function ProductRail({ title, href, linkLabel, products }: { title: string; href?: string; linkLabel?: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="container-x mt-16">
      <div data-reveal className="mb-6 flex items-end justify-between gap-4">
        <h2 className="section-title">{title}</h2>
        {href && (
          <Link href={href} className="group/link inline-flex items-center gap-1 text-sm font-semibold text-muted transition hover:text-fg">
            {linkLabel} <ArrowRight className="size-4 transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        )}
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.slice(0, products.length >= 8 ? 8 : products.length >= 4 ? 4 : products.length).map((p, idx) => (
          <div key={p.id} data-reveal style={{ '--i': idx % 4 } as React.CSSProperties} className="w-[46%] shrink-0 snap-start sm:w-auto [&>article]:h-full">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
