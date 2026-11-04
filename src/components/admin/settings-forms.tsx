'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveSetting, telegramSetWebhook, telegramTest } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import { useAdminT } from '@/i18n/admin/provider';
import type { AdminDict } from '@/i18n/admin';
import type { Contacts } from '@/lib/types';

export function UsdRateForm({ rate }: { rate: number }) {
  const { t } = useAdminT();
  const router = useRouter();
  const [v, setV] = useState(String(rate));
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(v.replace(/\s/g, ''));
        if (!(n > 0)) return toast.error(t.settings.enterRate);
        start(async () => {
          const r = await saveSetting('usd_rate', n);
          if (r.ok) toast.ok(t.settings.rateSaved);
          else toast.error(r.error);
          router.refresh();
        });
      }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">1 $ =</span>
        <input value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" aria-label={t.settings.usdRate} className="input pl-14" />
      </div>
      <button disabled={pending} className="btn-primary">
        {t.common.save}
      </button>
    </form>
  );
}

type ContactField = keyof Contacts & keyof AdminDict['settings']['fields'];

const CONTACT_FIELDS: { key: ContactField; half?: boolean }[] = [
  { key: 'phone', half: true },
  { key: 'phone_raw', half: true },
  { key: 'hours_ru' },
  { key: 'hours_uz', half: true },
  { key: 'hours_en', half: true },
  { key: 'address_ru' },
  { key: 'address_uz', half: true },
  { key: 'address_en', half: true },
  { key: 'telegram', half: true },
  { key: 'instagram', half: true },
  { key: 'facebook', half: true },
  { key: 'youtube', half: true },
];

export function ContactsForm({ contacts }: { contacts: Contacts }) {
  const { t } = useAdminT();
  const router = useRouter();
  const [c, setC] = useState(contacts);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveSetting('contacts', c);
          if (r.ok) toast.ok(t.settings.contactsSaved);
          else toast.error(r.error);
          router.refresh();
        });
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      {CONTACT_FIELDS.map((f) => (
        <div key={f.key} className={f.half ? '' : 'sm:col-span-2'}>
          <label className="label">{t.settings.fields[f.key]}</label>
          <input value={c[f.key] ?? ''} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} className="input" />
        </div>
      ))}
      <div className="sm:col-span-2">
        <button disabled={pending} className="btn-primary">
          {t.settings.saveContacts}
        </button>
      </div>
    </form>
  );
}

export function TelegramButtons() {
  const { t } = useAdminT();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.ok(r.message ?? t.settings.done);
      else toast.error(r.error ?? t.common.error);
    });
  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={pending} onClick={() => run(telegramTest)} className="btn-outline">
        {t.settings.sendTest}
      </button>
      <button disabled={pending} onClick={() => run(telegramSetWebhook)} className="btn-outline">
        {t.settings.connectWebhook}
      </button>
    </div>
  );
}
