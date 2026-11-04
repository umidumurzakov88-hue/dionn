import Link from 'next/link';
import { StatusPicker } from './status-picker';
import { getAdminT } from '@/lib/admin-i18n';
import { uzsL } from '@/i18n/admin';
import { formatDate } from '@/lib/format';
import type { Order } from '@/lib/types';

/** Server component (uses the admin locale cookie). */
export async function OrdersTable({ orders }: { orders: Order[] }) {
  const { t, locale } = await getAdminT();
  const c = t.orders.col;
  if (!orders.length) return <p className="px-5 pb-6 text-sm text-muted">{t.orders.empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-y border-border bg-surface-2/50 text-left text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-5 py-3">{c.number}</th>
            <th className="px-5 py-3">{c.date}</th>
            <th className="px-5 py-3">{c.customer}</th>
            <th className="px-5 py-3">{c.status}</th>
            <th className="px-5 py-3 text-right">{c.total}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o, i) => (
            <tr key={o.id} className="animate-stagger-item transition hover:bg-surface-2/60" style={{ '--i': Math.min(i, 12) } as React.CSSProperties}>
              <td className="px-5 py-3 font-bold">
                <Link href={`/admin/orders/${o.id}`} className="hover:text-accent">
                  {c.number}{o.number}
                </Link>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(o.created_at, locale)}</td>
              <td className="px-5 py-3">
                <Link href={`/admin/orders/${o.id}`} className="block">
                  <span className="font-medium">{o.customer_name}</span>
                  <span className="block text-xs text-muted">{o.phone}</span>
                </Link>
              </td>
              <td className="px-5 py-3">
                <StatusPicker orderId={o.id} status={o.status} />
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-semibold">{uzsL(o.total, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
