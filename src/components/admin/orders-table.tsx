import Link from 'next/link';
import { StatusBadge, uzs } from './ui';
import { formatDate } from '@/lib/format';
import type { Order } from '@/lib/types';

export function OrdersTable({ orders }: { orders: Order[] }) {
  if (!orders.length) return <p className="px-5 pb-6 text-sm text-muted">Заказов пока нет</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-y border-border bg-surface-2/50 text-left text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-5 py-3">№</th>
            <th className="px-5 py-3">Дата</th>
            <th className="px-5 py-3">Клиент</th>
            <th className="px-5 py-3">Статус</th>
            <th className="px-5 py-3 text-right">Сумма</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => (
            <tr key={o.id} className="transition hover:bg-surface-2/60">
              <td className="px-5 py-3 font-bold">
                <Link href={`/admin/orders/${o.id}`} className="hover:text-accent">
                  №{o.number}
                </Link>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(o.created_at)}</td>
              <td className="px-5 py-3">
                <Link href={`/admin/orders/${o.id}`} className="block">
                  <span className="font-medium">{o.customer_name}</span>
                  <span className="block text-xs text-muted">{o.phone}</span>
                </Link>
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={o.status} />
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-semibold">{uzs(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
