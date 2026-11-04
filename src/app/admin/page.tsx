import Link from 'next/link';
import { ArrowRight, CalendarDays, Receipt, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { getAdminT } from '@/lib/admin-i18n';
import { fmt, uzsL } from '@/i18n/admin';
import { PageHeader } from '@/components/admin/ui';
import { OrdersChart, RevenueChart, type DayPoint } from '@/components/admin/charts';
import { OrdersTable } from '@/components/admin/orders-table';
import { CountUp } from '@/components/admin/count-up';
import { ORDER_STATUSES, type Order } from '@/lib/types';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.dash.title };
}

interface Stats {
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  revenue_total: number;
  revenue_delivered: number;
  orders_today: number;
  orders_month: number;
  orders_total: number;
  orders_new: number;
  orders_cancelled: number;
  avg_check: number;
  customers_total: number;
  customers_month: number;
}

const STATUS_BAR: Record<string, string> = {
  new: 'bg-blue-500',
  confirmed: 'bg-violet-500',
  delivering: 'bg-amber-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const [{ supabase }, { t, locale }] = await Promise.all([requireStaff(), getAdminT()]);
  const d = t.dash;
  const uzs = (v: number | string | null | undefined) => uzsL(v, locale);
  const { days: dq } = await searchParams;
  const days = [7, 30, 90].includes(Number(dq)) ? Number(dq) : 30;

  const [{ data: stats }, { data: series }, { data: top }, { data: recent }, { data: byStatus }] = await Promise.all([
    supabase.rpc('admin_stats'),
    supabase.rpc('admin_revenue_by_day', { days }),
    supabase.rpc('admin_top_products', { lim: 6 }),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('orders').select('status'),
  ]);
  const s = (stats ?? {}) as Stats;
  const points: DayPoint[] = ((series as DayPoint[]) ?? []).map((p) => ({ day: p.day, revenue: Number(p.revenue), orders: Number(p.orders) }));
  const periodRevenue = points.reduce((a, p) => a + p.revenue, 0);
  const periodOrders = points.reduce((a, p) => a + p.orders, 0);
  const statusCounts = ORDER_STATUSES.map((st) => ({ st, n: (byStatus ?? []).filter((o) => o.status === st).length }));
  const totalOrders = statusCounts.reduce((a, x) => a + x.n, 0) || 1;

  const kpis = [
    { label: d.revenueToday, value: Number(s.revenue_today ?? 0), money: true, sub: `${s.orders_today ?? 0} ${d.ordersCount}`, icon: Wallet },
    { label: d.revenueWeek, value: Number(s.revenue_week ?? 0), money: true, sub: d.noCancelled, icon: TrendingUp },
    { label: d.revenueMonth, value: Number(s.revenue_month ?? 0), money: true, sub: `${s.orders_month ?? 0} ${d.ordersCount}`, icon: CalendarDays },
    { label: d.revenueTotal, value: Number(s.revenue_total ?? 0), money: true, sub: `${d.deliveredFor} ${uzs(s.revenue_delivered)}`, icon: Receipt },
    {
      label: d.ordersTotal,
      value: Number(s.orders_total ?? 0),
      money: false,
      sub: `${s.orders_new ?? 0} ${d.newCount} · ${s.orders_cancelled ?? 0} ${d.cancelledCount}`,
      icon: ShoppingCart,
    },
    { label: d.avgCheck, value: Number(s.avg_check ?? 0), money: true, sub: d.byAllOrders, icon: Receipt },
    { label: d.customers, value: Number(s.customers_total ?? 0), money: false, sub: `+${s.customers_month ?? 0} ${d.per30}`, icon: Users },
  ];

  return (
    <>
      <PageHeader title={d.title} subtitle={d.subtitle} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, money, sub, icon: Icon }, i) => (
          <div
            key={label}
            data-reveal
            style={{ '--i': i } as React.CSSProperties}
            className="card hover-lift group p-5 hover:border-accent/40 hover:shadow-xl hover:shadow-black/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{label}</p>
              <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">
              <CountUp value={value} money={money} />
            </p>
            <p className="mt-1 text-xs text-muted">{sub}</p>
          </div>
        ))}
        {s.orders_new > 0 && (
          <Link
            href="/admin/orders?status=new"
            data-reveal
            style={{ '--i': kpis.length } as React.CSSProperties}
            className="card hover-lift group relative flex flex-col justify-between overflow-hidden bg-accent p-5 text-white hover:shadow-xl hover:shadow-accent/30"
          >
            <span className="absolute -right-6 -top-6 size-24 animate-ping rounded-full bg-white/10 [animation-duration:2.5s]" />
            <p className="text-sm opacity-90">{d.awaiting}</p>
            <p className="text-3xl font-extrabold">
              <CountUp value={s.orders_new} />
            </p>
            <p className="flex items-center gap-1 text-xs font-semibold">
              {d.process} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section data-reveal className="card p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">{d.revenueByDay}</h2>
              <p className="text-sm text-muted">
                {uzs(periodRevenue)} · {periodOrders} {d.ordersCount} {fmt(d.forDays, { n: days })}
              </p>
            </div>
            <div className="relative inline-grid grid-cols-3 rounded-full bg-surface-2 p-0.5 text-xs font-semibold">
              <span
                aria-hidden
                className="absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-full bg-surface shadow-sm transition-transform duration-300"
                style={{ transform: `translateX(${[7, 30, 90].indexOf(days) * 100}%)` }}
              />
              {[7, 30, 90].map((n) => (
                <Link key={n} href={`/admin?days=${n}`} className={`relative z-10 rounded-full px-3 py-1.5 text-center transition-colors ${n === days ? '' : 'text-muted hover:text-fg'}`}>
                  {n} {d.daysShort}
                </Link>
              ))}
            </div>
          </div>
          <RevenueChart data={points} />
          <h3 className="mb-1 mt-4 text-sm font-semibold text-muted">{d.ordersByDay}</h3>
          <OrdersChart data={points} />
        </section>

        <div className="space-y-6">
          <section data-reveal style={{ '--i': 1 } as React.CSSProperties} className="card p-5">
            <h2 className="mb-4 font-bold">{d.byStatus}</h2>
            <ul className="space-y-3">
              {statusCounts.map(({ st, n }, i) => (
                <li key={st}>
                  <Link href={`/admin/orders?status=${st}`} className="group block">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="transition-colors group-hover:text-accent">{t.status[st]}</span>
                      <span className="font-semibold">{n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`animate-bar h-full origin-left rounded-full ${STATUS_BAR[st] ?? 'bg-fg'}`}
                        style={{ width: `${(n / totalOrders) * 100}%`, '--i': i } as React.CSSProperties}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section data-reveal style={{ '--i': 2 } as React.CSSProperties} className="card p-5">
            <h2 className="mb-4 font-bold">{d.topProducts}</h2>
            {!top?.length ? (
              <p className="text-sm text-muted">{d.noSales}</p>
            ) : (
              <ol className="space-y-3">
                {(top as { product_id: string; name: string; qty: number; revenue: number }[]).map((p, i) => (
                  <li
                    key={p.product_id ?? i}
                    className="animate-stagger-item flex items-center gap-3 rounded-lg text-sm transition hover:translate-x-1"
                    style={{ '--i': i + 4 } as React.CSSProperties}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                        i === 0 ? 'bg-accent text-white' : 'bg-surface-2'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="text-right">
                      <span className="block font-semibold">{uzs(p.revenue)}</span>
                      <span className="text-xs text-muted">
                        {p.qty} {t.common.pcs}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <section data-reveal className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-bold">{d.recentOrders}</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-muted transition hover:text-fg">
            {d.allOrders}
          </Link>
        </div>
        <OrdersTable orders={(recent as Order[]) ?? []} />
      </section>
    </>
  );
}
