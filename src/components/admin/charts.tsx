'use client';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactUzs, uzs } from './ui';

export interface DayPoint {
  day: string;
  revenue: number;
  orders: number;
}

const tick = { fill: 'var(--muted)', fontSize: 12 };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = new Date(label + 'T00:00:00');
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold">{d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-muted">
          {p.dataKey === 'revenue' ? `Выручка: ${uzs(p.value)}` : `Заказов: ${p.value}`}
        </p>
      ))}
    </div>
  );
}

const shortDate = (v: string) => {
  const d = new Date(v + 'T00:00:00');
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function RevenueChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="day" tickFormatter={shortDate} tick={tick} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={compactUzs} tick={tick} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
        <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2.5} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrdersChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="day" tickFormatter={shortDate} tick={tick} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
        <Bar dataKey="orders" fill="var(--fg)" radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
