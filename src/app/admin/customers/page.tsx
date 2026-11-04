import Link from 'next/link';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/admin-auth';
import { PageHeader } from '@/components/admin/ui';
import { getAdminT } from '@/lib/admin-i18n';
import { uzsL } from '@/i18n/admin';
import { Pagination, SearchBar } from '@/components/admin/search-bar';
import { formatDate } from '@/lib/format';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.customers.title };
}
const PER_PAGE = 30;

interface Row {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  orders_count: number;
  total_spent: number;
  last_order: string | null;
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; tab?: string }> }) {
  const [{ supabase }, { t, locale }] = await Promise.all([requireStaff(), getAdminT()]);
  const c = t.customers;
  const uzs = (v: number | string | null | undefined) => uzsL(v, locale);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const tab = sp.tab === 'guests' ? 'guests' : 'users';
  const search = (sp.q ?? '').trim();

  let users: Row[] = [];
  let guests: { phone: string; name: string; orders: number; total: number; last: string }[] = [];
  let hasMore = false;

  if (tab === 'users') {
    const { data } = await supabase.rpc('admin_customers', { search, lim: PER_PAGE + 1, off: (page - 1) * PER_PAGE });
    users = (data as Row[]) ?? [];
    hasMore = users.length > PER_PAGE;
    users = users.slice(0, PER_PAGE);
  } else {
    // Guests = orders placed without an account, grouped by phone
    let q = supabase.from('orders').select('phone, customer_name, total, status, created_at').is('user_id', null).order('created_at', { ascending: false }).limit(2000);
    if (search) {
      const s = search.replace(/[%,()]/g, ' ');
      const digits = s.replace(/\D/g, '');
      q = q.or([`customer_name.ilike.%${s}%`, ...(digits.length >= 3 ? [`phone.ilike.%${digits}%`] : [])].join(','));
    }
    const { data } = await q;
    const map = new Map<string, (typeof guests)[number]>();
    for (const o of data ?? []) {
      const g = map.get(o.phone) ?? { phone: o.phone, name: o.customer_name, orders: 0, total: 0, last: o.created_at };
      g.orders += 1;
      if (o.status !== 'cancelled') g.total += Number(o.total);
      map.set(o.phone, g);
    }
    guests = [...map.values()];
  }

  const tabHref = (tb: string) => `/admin/customers?tab=${tb}${search ? `&q=${encodeURIComponent(search)}` : ''}`;

  return (
    <>
      <PageHeader title={c.title} subtitle={c.subtitle}>
        <Suspense>
          <SearchBar placeholder={c.searchPlaceholder} />
        </Suspense>
      </PageHeader>

      <div className="mb-4 flex gap-2">
        <Link href={tabHref('users')} className={`chip px-4 py-2 ${tab === 'users' ? 'bg-primary text-primary-fg' : 'bg-surface-2'}`}>
          {c.tabUsers}
        </Link>
        <Link href={tabHref('guests')} className={`chip px-4 py-2 ${tab === 'guests' ? 'bg-primary text-primary-fg' : 'bg-surface-2'}`}>
          {c.tabGuests}
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'users' ? (
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border bg-surface-2/50 text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3">{c.colCustomer}</th>
                  <th className="px-5 py-3">{c.colPhone}</th>
                  <th className="px-5 py-3">{c.colRegistered}</th>
                  <th className="px-5 py-3 text-right">{c.colOrders}</th>
                  <th className="px-5 py-3 text-right">{c.colSpent}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u, i) => (
                  <tr key={u.id} className="animate-stagger-item hover:bg-surface-2/60" style={{ '--i': i } as React.CSSProperties}>
                    <td className="px-5 py-3">
                      <Link href={`/admin/customers/${u.id}`} className="block">
                        <span className="font-semibold hover:text-accent">{u.full_name || '—'}</span>
                        {u.role !== 'customer' && <span className="chip ml-2 bg-accent-soft text-accent">{c.role[u.role]}</span>}
                        <span className="block text-xs text-muted">{u.email}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">{u.phone || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(u.created_at, locale, false)}</td>
                    <td className="px-5 py-3 text-right">{u.orders_count}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold">{uzs(u.total_spent)}</td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted">
                      {c.nobody}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-surface-2/50 text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3">{c.colName}</th>
                  <th className="px-5 py-3">{c.colPhone}</th>
                  <th className="px-5 py-3">{c.colLastOrder}</th>
                  <th className="px-5 py-3 text-right">{c.colOrders}</th>
                  <th className="px-5 py-3 text-right">{c.colSpent}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {guests.map((g, i) => (
                  <tr key={g.phone} className="animate-stagger-item hover:bg-surface-2/60" style={{ '--i': i } as React.CSSProperties}>
                    <td className="px-5 py-3 font-semibold">{g.name}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders?q=${encodeURIComponent(g.phone)}`} className="hover:text-accent">
                        {g.phone}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(g.last, locale)}</td>
                    <td className="px-5 py-3 text-right">{g.orders}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold">{uzs(g.total)}</td>
                  </tr>
                ))}
                {!guests.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted">
                      {c.nobody}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {tab === 'users' && (
          <Suspense>
            <Pagination page={page} pages={hasMore ? page + 1 : page} />
          </Suspense>
        )}
      </div>
    </>
  );
}
