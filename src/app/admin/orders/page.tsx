import Link from 'next/link';
import { Suspense } from 'react';
import { Download } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { PageHeader } from '@/components/admin/ui';
import { getAdminT } from '@/lib/admin-i18n';
import { fmt, uzsL } from '@/i18n/admin';
import { OrdersTable } from '@/components/admin/orders-table';
import { Pagination, SearchBar } from '@/components/admin/search-bar';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.orders.title };
}
const PER_PAGE = 25;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; from?: string; to?: string }>;
}) {
  const { supabase } = await requireStaff();
  const { t, locale } = await getAdminT();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : null;

  let q = supabase.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (sp.from) q = q.gte('created_at', `${sp.from}T00:00:00+05:00`);
  if (sp.to) q = q.lte('created_at', `${sp.to}T23:59:59+05:00`);
  if (sp.q) {
    const s = sp.q.replace(/[%,()]/g, ' ').trim();
    const num = Number(s.replace(/\D/g, ''));
    const digits = s.replace(/\D/g, '');
    const ors = [`customer_name.ilike.%${s}%`, `email.ilike.%${s}%`];
    if (digits.length >= 3) ors.push(`phone.ilike.%${digits}%`);
    if (num && digits.length <= 9) ors.push(`number.eq.${num}`);
    q = q.or(ors.join(','));
  }
  const { data, count } = await q.range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  const orders = (data as Order[]) ?? [];
  const pageSum = orders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + Number(o.total), 0);

  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    p.delete('page');
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const s = p.toString();
    return s ? `?${s}` : '';
  };

  return (
    <>
      <PageHeader
        title={t.orders.title}
        subtitle={`${fmt(t.orders.found, { n: count ?? 0 })}${orders.length ? ` · ${fmt(t.orders.onPage, { sum: uzsL(pageSum, locale) })}` : ''}`}
      >
        <a href={`/admin/orders/export${qs({})}`} className="btn-outline h-10 py-0">
          <Download className="size-4" /> {t.orders.exportCsv}
        </a>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Suspense>
          <SearchBar placeholder={t.orders.searchPlaceholder} />
        </Suspense>
        <form className="flex items-center gap-2 text-sm">
          {status && <input type="hidden" name="status" value={status} />}
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          <input type="date" name="from" defaultValue={sp.from} aria-label={t.orders.dateFrom} title={t.orders.dateFrom} className="input h-10 w-auto py-0" />
          <span className="text-muted">—</span>
          <input type="date" name="to" defaultValue={sp.to} aria-label={t.orders.dateTo} title={t.orders.dateTo} className="input h-10 w-auto py-0" />
          <button className="btn-outline h-10 py-0">{t.orders.apply}</button>
        </form>
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        <Link href={`/admin/orders${qs({ status: null })}`} className={`chip shrink-0 px-4 py-2 ${!status ? 'bg-primary text-primary-fg' : 'bg-surface-2'}`}>
          {t.common.all}
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders${qs({ status: s })}`} className={`chip shrink-0 px-4 py-2 ${status === s ? 'bg-primary text-primary-fg' : 'bg-surface-2'}`}>
            {t.status[s]}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <OrdersTable orders={orders} />
        <Suspense>
          <Pagination page={page} pages={Math.ceil((count ?? 0) / PER_PAGE)} />
        </Suspense>
      </div>
    </>
  );
}
