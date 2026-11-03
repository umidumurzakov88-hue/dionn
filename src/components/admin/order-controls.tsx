'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteOrder, updateOrderMeta, updateOrderStatus } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from '@/lib/types';
import { PAYMENT_STATUS_LABEL, STATUS_LABEL } from './ui';

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
  const [pending, start] = useTransition();
  const [text, setText] = useState(note);

  const setStatus = (s: OrderStatus) =>
    start(async () => {
      const r = await updateOrderStatus(id, s);
      if (r.ok) toast.ok(r.message ?? 'Сохранено');
      else toast.error(r.error);
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <div>
        <p className="label">Статус заказа</p>
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
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Если клиент подключил Telegram — он получит уведомление.</p>
      </div>

      <div>
        <label className="label">Оплата</label>
        <select
          defaultValue={paymentStatus}
          disabled={pending}
          onChange={(e) =>
            start(async () => {
              const r = await updateOrderMeta(id, { payment_status: e.target.value });
              if (r.ok) toast.ok('Сохранено');
              else toast.error(r.error);
            })
          }
          className="input"
        >
          {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Заметка менеджера (видна только в админке)</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="input" />
        <button
          disabled={pending || text === note}
          onClick={() =>
            start(async () => {
              const r = await updateOrderMeta(id, { admin_note: text });
              if (r.ok) toast.ok('Заметка сохранена');
              else toast.error(r.error);
              router.refresh();
            })
          }
          className="btn-outline mt-2 w-full"
        >
          Сохранить заметку
        </button>
      </div>

      {isAdmin && (
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm('Удалить заказ безвозвратно?')) return;
            start(async () => {
              const r = await deleteOrder(id);
              if (r.ok) {
                toast.ok('Заказ удалён');
                router.push('/admin/orders');
              } else toast.error(r.error);
            });
          }}
          className="btn-ghost w-full text-sm text-danger"
        >
          <Trash2 className="size-4" /> Удалить заказ
        </button>
      )}
    </div>
  );
}
