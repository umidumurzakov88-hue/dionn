'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteOrder, updateOrderMeta, updateOrderStatus } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from '@/lib/types';
import { useAdminT } from '@/i18n/admin/provider';

export function OrderControls({
  id,
  status,
  paymentStatus,
  note,
  isAdmin,
}: {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  note: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { t } = useAdminT();
  const c = t.orders.controls;
  const [pending, start] = useTransition();
  const [text, setText] = useState(note);

  const setStatus = (s: OrderStatus) =>
    start(async () => {
      const r = await updateOrderStatus(id, s);
      if (r.ok) toast.ok(r.message ?? t.common.saved);
      else toast.error(r.error);
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <div>
        <p className="label">{c.status}</p>
        <div className="grid grid-cols-2 gap-2">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              disabled={pending || s === status}
              onClick={() => setStatus(s)}
              className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                s === status ? 'border-fg bg-primary text-primary-fg disabled:opacity-100' : 'border-border hover:border-fg'
              }`}
            >
              {t.status[s]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{c.tgHint}</p>
      </div>

      <div>
        <label className="label">{c.payment}</label>
        <select
          defaultValue={paymentStatus}
          disabled={pending}
          onChange={(e) =>
            start(async () => {
              const r = await updateOrderMeta(id, { payment_status: e.target.value });
              if (r.ok) toast.ok(t.common.saved);
              else toast.error(r.error);
            })
          }
          className="input"
        >
          {Object.entries(t.paymentStatus).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">{c.note}</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="input" />
        <button
          disabled={pending || text === note}
          onClick={() =>
            start(async () => {
              const r = await updateOrderMeta(id, { admin_note: text });
              if (r.ok) toast.ok(c.noteSaved);
              else toast.error(r.error);
              router.refresh();
            })
          }
          className="btn-outline mt-2 w-full"
        >
          {c.saveNote}
        </button>
      </div>

      {isAdmin && (
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm(c.confirmDelete)) return;
            start(async () => {
              const r = await deleteOrder(id);
              if (r.ok) {
                toast.ok(c.deleted);
                router.push('/admin/orders');
              } else toast.error(r.error);
            });
          }}
          className="btn-ghost w-full text-sm text-danger"
        >
          <Trash2 className="size-4" /> {c.delete}
        </button>
      )}
    </div>
  );
}
