import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

export function ProductGrid({ products, cols = 4 }: { products: Product[]; cols?: 3 | 4 }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 ${cols === 4 ? 'lg:grid-cols-4' : ''}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
