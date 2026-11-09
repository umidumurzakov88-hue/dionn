import { NextResponse } from 'next/server';
import { getStaff } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export interface AdminNotification {
  id: string;
  kind: 'order' | 'callback' | 'review';
  title: string; // customer / author name
  detail: string; // phone, order total, rating…
  href: string;
  at: string; // ISO date
}

/** Polled by the admin bell: open counters + the latest events. */
export async function GET() {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const sb = staff.supabase;

  const [stats, orders, callbacks, reviews, customNew] = await Promise.all([
    sb.rpc('admin_stats'),
    sb.from('orders').select('id, number, customer_name, total, created_at').order('created_at', { ascending: false }).limit(10),
    sb.from('callback_requests').select('id, name, phone, created_at').eq('handled', false).order('created_at', { ascending: false }).limit(10),
    sb.from('reviews').select('id, name, rating, created_at').eq('is_approved', false).order('created_at', { ascending: false }).limit(10),
    sb.from('custom_orders').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);

  const items: AdminNotification[] = [
    ...(orders.data ?? []).map((o) => ({
      id: `o-${o.id}`,
      kind: 'order' as const,
      title: `#${o.number} · ${o.customer_name}`,
      detail: String(o.total),
      href: `/admin/orders/${o.id}`,
      at: o.created_at,
    })),
    ...(callbacks.data ?? []).map((c) => ({
      id: `c-${c.id}`,
      kind: 'callback' as const,
      title: c.name,
      detail: c.phone,
      href: '/admin/callbacks',
      at: c.created_at,
    })),
    ...(reviews.data ?? []).map((r) => ({
      id: `r-${r.id}`,
      kind: 'review' as const,
      title: r.name,
      detail: '★'.repeat(r.rating),
      href: '/admin/reviews',
      at: r.created_at,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 20);

  const s = stats.data ?? {};
  return NextResponse.json({
    counts: { orders_new: s.orders_new ?? 0, callbacks_open: s.callbacks_open ?? 0, reviews_pending: s.reviews_pending ?? 0, custom_new: customNew.count ?? 0 },
    items,
  });
}
