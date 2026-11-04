import { Banknote, CalendarClock, CreditCard, Smartphone, type LucideIcon } from 'lucide-react';
import type { PaymentMethod, PaymentStatus } from '@/lib/types';
import type { AdminDict } from '@/i18n/admin';
import { PAY_STATUS_CLS } from './status-colors';

export const PAY_ICON: Record<PaymentMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  click: Smartphone,
  payme: Smartphone,
  uzum: Smartphone,
  installment: CalendarClock,
};

/** Payment type + payment status, for the orders list (server or client). */
export function PaymentBadge({ method, status, t }: { method: PaymentMethod; status: PaymentStatus; t: AdminDict }) {
  const Icon = PAY_ICON[method] ?? Banknote;
  return (
    <span className="flex flex-col items-start gap-1">
      <span className="flex items-center gap-1.5 whitespace-nowrap font-medium">
        <Icon className="size-4 shrink-0 text-muted" />
        {t.payment[method] ?? method}
      </span>
      <span className={`chip px-2 py-0.5 text-[11px] ${PAY_STATUS_CLS[status]}`}>{t.paymentStatus[status]}</span>
    </span>
  );
}
