import type { OrderStatus } from '@/lib/types';

/** Order status colours — shared by server and client components. */
export const STATUS_CLS: Record<OrderStatus, string> = {
  new: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
  confirmed: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  delivering: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  delivered: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-red-500/12 text-red-600 dark:text-red-400',
};

export const STATUS_DOT: Record<OrderStatus, string> = {
  new: 'bg-blue-500',
  confirmed: 'bg-violet-500',
  delivering: 'bg-amber-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};
