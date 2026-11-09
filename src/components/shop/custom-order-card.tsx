'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Check, Send, X } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { toast } from '@/components/ui/toast';
import { formatDate, formatPrice } from '@/lib/format';
import type { CustomOrder } from '@/lib/types';

/** Where customers write after accepting a price. */
export const WORKSHOP_TG = 'dionn_f';

const TONE: Record<CustomOrder['status'], string> = {
  new: 'bg-surface-2 text-muted',
  quoted: 'bg-accent-soft text-accent',
  accepted: 'bg-success/10 text-success',
  declined: 'bg-danger/10 text-danger',
};

export function CustomOrderCard({ order }: { order: CustomOrder }) {
  const { t, locale } = useI18n();
  const c = t.custom;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(order.status);

  const respond = (action: 'accept' | 'decline') =>
    start(async () => {
      const res = await fetch('/api/custom-orders/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, action }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      if (res?.ok) setStatus(data.status);
      else toast.error(t.common.error);
      router.refresh();
    });

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold">
            {c.order} №{order.number}
          </p>
          <p className="text-sm text-muted">{formatDate(order.created_at, locale)}</p>
        </div>
        <span className={`chip ${TONE[status]}`}>{c.status[status]}</span>
      </div>

      {order.images.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {order.images.map((src) => (
            <a key={src} href={src} target="_blank" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnails of user uploads */}
              <img src={src} alt="" className="size-16 rounded-lg border border-border object-cover" />
            </a>
          ))}
        </div>
      )}
      <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm">{order.description}</p>

      {status === 'new' && <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">{c.waiting}</p>}

      {status !== 'new' && order.price != null && (
        <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm">
          <p>
            {c.price}: <b className="text-base">{formatPrice(Number(order.price), 'UZS', 1, locale)}</b>
          </p>
          {order.lead_time && (
            <p className="mt-0.5">
              {c.leadTime}: <b>{order.lead_time}</b>
            </p>
          )}
          {order.admin_comment && <p className="mt-2 whitespace-pre-line text-muted">{order.admin_comment}</p>}
        </div>
      )}

      {status === 'quoted' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={pending} onClick={() => respond('accept')} className="btn-primary">
            <Check className="size-4" /> {c.accept}
          </button>
          <button disabled={pending} onClick={() => confirm(c.confirmDecline) && respond('decline')} className="btn-outline">
            <X className="size-4" /> {c.decline}
          </button>
        </div>
      )}

      {status === 'accepted' && (
        <p className="mt-4 rounded-xl bg-success/10 px-4 py-3 text-sm">
          {c.acceptedText}{' '}
          <a href={`https://t.me/${WORKSHOP_TG}`} target="_blank" className="inline-flex items-center gap-1 font-bold text-accent hover:underline">
            <Send className="size-3.5" />@{WORKSHOP_TG}
          </a>
        </p>
      )}

      {status === 'declined' && <p className="mt-4 text-sm text-muted">{c.declinedText}</p>}
    </div>
  );
}
