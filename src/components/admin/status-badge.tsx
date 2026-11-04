'use client';
import type { OrderStatus } from '@/lib/types';
import { useAdminT } from '@/i18n/admin/provider';

export const STATUS_CLS: Record<OrderStatus, string> = {
  new: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
  confirmed: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  delivering: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  delivered: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-red-500/12 text-red-600 dark:text-red-400',
};

/** Translated order-status chip (works in server and client components). */
export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useAdminT();
  return <span className={`chip transition-colors duration-300 ${STATUS_CLS[status]}`}>{t.status[status]}</span>;
}
