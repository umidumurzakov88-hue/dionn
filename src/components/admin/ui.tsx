import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/types';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  delivering: 'Доставляется',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const STATUS_CLS: Record<OrderStatus, string> = {
  new: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
  confirmed: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  delivering: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  delivered: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-red-500/12 text-red-600 dark:text-red-400',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Наличные',
  card: 'Карта при получении',
  click: 'Click',
  payme: 'Payme',
  uzum: 'Uzum Bank',
  installment: 'Рассрочка',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Не оплачен',
  paid: 'Оплачен',
  failed: 'Ошибка оплаты',
  refunded: 'Возврат',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`chip ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function PageHeader({ title, children, subtitle }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export const uzs = (v: number | string | null | undefined) =>
  `${Math.round(Number(v ?? 0))
    .toLocaleString('ru-RU')
    .replace(/,/g, ' ')} сум`;

export const compactUzs = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace('.0', '')} млрд`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace('.0', '')} млн`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} тыс`;
  return String(Math.round(v));
};

export function Empty({ text }: { text: string }) {
  return <div className="card p-12 text-center text-muted">{text}</div>;
}
