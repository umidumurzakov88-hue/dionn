'use client';
import type { OrderStatus } from '@/lib/types';
import { useAdminT } from '@/i18n/admin/provider';

import { STATUS_CLS } from './status-colors';

/** Translated order-status chip (works in server and client components). */
export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useAdminT();
  return <span className={`chip transition-colors duration-300 ${STATUS_CLS[status]}`}>{t.status[status]}</span>;
}
