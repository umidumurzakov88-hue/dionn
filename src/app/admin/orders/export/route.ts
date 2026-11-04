import { NextResponse, type NextRequest } from 'next/server';
import { getStaff } from '@/lib/admin-auth';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';
import { getAdminT } from '@/lib/admin-i18n';
import { formatDate } from '@/lib/format';

/** CSV export of orders (opens in Excel). Same filters as the orders list. */
export async function GET(req: NextRequest) {
  const staff = await getStaff();
  if (!staff) return new NextResponse('Forbidden', { status: 403 });
  const sp = req.nextUrl.searchParams;
  const { t, locale } = await getAdminT();
  const c = t.orders.col;

  let q = staff.supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(5000);
  const status = sp.get('status');
  if (status && ORDER_STATUSES.includes(status as OrderStatus)) q = q.eq('status', status);
  if (sp.get('from')) q = q.gte('created_at', `${sp.get('from')}T00:00:00+05:00`);
  if (sp.get('to')) q = q.lte('created_at', `${sp.get('to')}T23:59:59+05:00`);
  const { data } = await q;

  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = [c.number, c.date, c.status, c.customer, c.phone, c.email, c.city, c.address, c.payment, c.items, c.discount, c.total];
  const rows = ((data as Order[]) ?? []).map((o) => [
    o.number,
    formatDate(o.created_at, locale),
    t.status[o.status],
    o.customer_name,
    o.phone,
    o.email,
    o.delivery_method === 'pickup' ? t.orders.csvPickup : o.city,
    o.address,
    t.payment[o.payment_method],
    o.order_items?.map((i) => `${i.name}${i.variant_name ? ` (${i.variant_name})` : ''} × ${i.qty}`).join('; '),
    Number(o.discount),
    Number(o.total),
  ]);
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="dionn-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
