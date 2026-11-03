'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Check, EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import { deleteRow, setCallbackHandled, setReviewApproved } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';

export function ReviewActions({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error((r as { error: string }).error);
      router.refresh();
    });
  return (
    <div className="flex gap-1">
      {approved ? (
        <button disabled={pending} onClick={() => run(() => setReviewApproved(id, false))} className="btn-outline px-3 py-2 text-xs">
          <EyeOff className="size-3.5" /> Скрыть
        </button>
      ) : (
        <button disabled={pending} onClick={() => run(() => setReviewApproved(id, true))} className="btn-primary px-3 py-2 text-xs">
          <Check className="size-3.5" /> Опубликовать
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => confirm('Удалить отзыв?') && run(() => deleteRow('reviews', id))}
        className="btn-ghost px-2 text-danger"
        aria-label="delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function CallbackActions({ id, handled }: { id: string; handled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await setCallbackHandled(id, !handled);
            if (!r.ok) toast.error(r.error);
            router.refresh();
          })
        }
        className={handled ? 'btn-outline px-3 py-2 text-xs' : 'btn-primary px-3 py-2 text-xs'}
      >
        {handled ? (
          <>
            <RotateCcw className="size-3.5" /> Вернуть
          </>
        ) : (
          <>
            <Check className="size-3.5" /> Обработано
          </>
        )}
      </button>
      <button
        disabled={pending}
        onClick={() =>
          confirm('Удалить заявку?') &&
          start(async () => {
            await deleteRow('callback_requests', id);
            router.refresh();
          })
        }
        className="btn-ghost px-2 text-danger"
        aria-label="delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
