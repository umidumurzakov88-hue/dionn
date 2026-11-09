'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { deleteCustomOrder, quoteCustomOrder } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import { useAdminT } from '@/i18n/admin/provider';

export function CustomOrderQuoteForm({
  id,
  price,
  leadTime,
  comment,
}: {
  id: string;
  price: number | null;
  leadTime: string | null;
  comment: string | null;
}) {
  const { t } = useAdminT();
  const c = t.feedback.custom;
  const router = useRouter();
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await quoteCustomOrder(id, {
        price: Number(String(fd.get('price') ?? '').replace(/\s/g, '')),
        lead_time: String(fd.get('lead_time') ?? ''),
        admin_comment: String(fd.get('admin_comment') ?? ''),
      });
      if (r.ok) toast.ok(r.message ?? c.quoteSent);
      else toast.error(r.error);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">{c.price}</span>
        <input name="price" required inputMode="numeric" defaultValue={price ?? ''} placeholder="4 500 000" className="input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">{c.leadTime}</span>
        <input name="lead_time" defaultValue={leadTime ?? ''} placeholder={c.leadTimePh} className="input" />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold text-muted">{c.comment}</span>
        <textarea name="admin_comment" rows={2} defaultValue={comment ?? ''} placeholder={c.commentPh} className="input" />
      </label>
      <div className="sm:col-span-2">
        <button disabled={pending} className="btn-primary">
          <Send className="size-4" /> {price != null ? c.updateQuote : c.sendQuote}
        </button>
      </div>
    </form>
  );
}

export function CustomOrderDelete({ id }: { id: string }) {
  const { t } = useAdminT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        confirm(t.feedback.custom.confirmDelete) &&
        start(async () => {
          const r = await deleteCustomOrder(id);
          if (!r.ok) toast.error(r.error);
          router.refresh();
        })
      }
      className="btn-ghost px-2 text-danger"
      aria-label={t.common.delete}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
