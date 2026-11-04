import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/types';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  delivering: 'Доставляется',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
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

export { StatusBadge } from './status-badge';

export function PageHeader({ title, children, subtitle }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="animate-page mb-6 flex flex-wrap items-end justify-between gap-4">
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
  return <div className="animate-scale-in card p-12 text-center text-muted">{text}</div>;
}
