'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toggleProductActive } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import { useAdminT } from '@/i18n/admin/provider';

export function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  const { t } = useAdminT();
  const router = useRouter();
  const [on, setOn] = useState(active);
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleProductActive(id, !on);
          if (r.ok) {
            setOn(!on);
            router.refresh();
          } else toast.error(r.error);
        })
      }
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${on ? 'bg-success' : 'bg-border'}`}
      aria-label={t.catalog.actions.toggleActive}
      aria-pressed={on}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
