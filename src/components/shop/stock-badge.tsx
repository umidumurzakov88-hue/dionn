'use client';
import { useI18n } from '@/i18n/provider';
import type { StockStatus } from '@/lib/types';

export function StockBadge({ status }: { status: StockStatus }) {
  const { t } = useI18n();
  const map = {
    in_stock: { text: t.product.inStock, cls: 'text-success', dot: 'bg-success' },
    preorder: { text: t.product.preorder, cls: 'text-warning', dot: 'bg-warning' },
    out_of_stock: { text: t.product.outOfStock, cls: 'text-muted', dot: 'bg-muted' },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${map.cls}`}>
      <span className={`size-1.5 rounded-full ${map.dot}`} />
      {map.text}
    </span>
  );
}
