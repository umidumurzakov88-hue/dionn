import Link from 'next/link';
import { ArrowRight, CalendarDays, Receipt, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { PageHeader, uzs, STATUS_LABEL } from '@/components/admin/ui';
import { OrdersChart, RevenueChart, type DayPoint } from '@/components/admin/charts';
import { OrdersTable } from '@/components/admin/orders-table';
import { ORDER_STATUSES, type Order } from '@/lib/types';

export const metadata = { title: 'Дашборд' };

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

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { supabase } = await requireStaff();
  const { days: d } = await searchParams;
  const days = [7, 30, 90].includes(Number(d)) ? Number(d) : 30;

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
    { label: 'Выручка сегодня', value: uzs(s.revenue_today), sub: `${s.orders_today ?? 0} заказов`, icon: Wallet },
    { label: 'Выручка за 7 дней', value: uzs(s.revenue_week), sub: 'без отменённых', icon: TrendingUp },
    { label: 'Выручка за месяц', value: uzs(s.revenue_month), sub: `${s.orders_month ?? 0} заказов`, icon: CalendarDays },
    { label: 'Выручка за всё время', value: uzs(s.revenue_total), sub: `доставлено на ${uzs(s.revenue_delivered)}`, icon: Receipt },
    { label: 'Всего заказов', value: String(s.orders_total ?? 0), sub: `${s.orders_new ?? 0} новых · ${s.orders_cancelled ?? 0} отменено`, icon: ShoppingCart },
    { label: 'Средний чек', value: uzs(s.avg_check), sub: 'по всем заказам', icon: Receipt },
    { label: 'Клиентов', value: String(s.customers_total ?? 0), sub: `+${s.customers_month ?? 0} за 30 дней`, icon: Users },
  ];

  return (
    <>
      <PageHeader title="Дашборд" subtitle="Ключевые показатели магазина (время — Ташкент)" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{label}</p>
              <Icon className="size-4 text-accent" />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted">{sub}</p>
          </div>
        ))}
        {s.orders_new > 0 && (
          <Link href="/admin/orders?status=new" className="card flex flex-col justify-between bg-accent p-5 text-white transition hover:opacity-90">
            <p className="text-sm opacity-90">Ждут обработки</p>
            <p className="text-3xl font-extrabold">{s.orders_new}</p>
            <p className="flex items-center gap-1 text-xs font-semibold">
              Обработать <ArrowRight className="size-3.5" />
            </p>
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="card p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Выручка по дням</h2>
              <p className="text-sm text-muted">
                {uzs(periodRevenue)} · {periodOrders} заказов за {days} дней
              </p>
            </div>
            <div className="inline-flex rounded-full bg-surface-2 p-0.5 text-xs font-semibold">
              {[7, 30, 90].map((n) => (
                <Link key={n} href={`/admin?days=${n}`} className={`rounded-full px-3 py-1.5 ${n === days ? 'bg-surface shadow-sm' : 'text-muted'}`}>
                  {n} дн.
                </Link>
              ))}
            </div>
          </div>
          <RevenueChart data={points} />
          <h3 className="mb-1 mt-4 text-sm font-semibold text-muted">Заказы по дням</h3>
          <OrdersChart data={points} />
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-bold">Заказы по статусам</h2>
            <ul className="space-y-3">
              {statusCounts.map(({ st, n }) => (
                <li key={st}>
                  <Link href={`/admin/orders?status=${st}`} className="block">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{STATUS_LABEL[st]}</span>
                      <span className="font-semibold">{n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-fg" style={{ width: `${(n / totalOrders) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-bold">Топ товаров по выручке</h2>
            {!top?.length ? (
              <p className="text-sm text-muted">Пока нет продаж</p>
            ) : (
              <ol className="space-y-3">
                {(top as { product_id: string; name: string; qty: number; revenue: number }[]).map((p, i) => (
                  <li key={p.product_id ?? i} className="flex items-center gap-3 text-sm">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="text-right">
                      <span className="block font-semibold">{uzs(p.revenue)}</span>
                      <span className="text-xs text-muted">{p.qty} шт.</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-bold">Последние заказы</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-muted hover:text-fg">
            Все заказы →
          </Link>
        </div>
        <OrdersTable orders={(recent as Order[]) ?? []} />
      </section>
    </>
  );
}

