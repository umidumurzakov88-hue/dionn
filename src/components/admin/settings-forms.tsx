'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveSetting, telegramSetWebhook, telegramTest } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import type { Contacts } from '@/lib/types';

export function UsdRateForm({ rate }: { rate: number }) {
  const router = useRouter();
  const [v, setV] = useState(String(rate));
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(v.replace(/\s/g, ''));
        if (!(n > 0)) return toast.error('Введите курс');
        start(async () => {
          const r = await saveSetting('usd_rate', n);
          if (r.ok) toast.ok('Курс сохранён');
          else toast.error(r.error);
          router.refresh();
        });
      }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">1 $ =</span>
        <input value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" className="input pl-14" />
      </div>
      <button disabled={pending} className="btn-primary">
        Сохранить
      </button>
    </form>
  );
}

const CONTACT_FIELDS: { key: keyof Contacts; label: string; half?: boolean }[] = [
  { key: 'phone', label: 'Телефон (как показывать)', half: true },
  { key: 'phone_raw', label: 'Телефон для звонка (+998…)', half: true },
  { key: 'hours_ru', label: 'Часы работы (RU)' },
  { key: 'hours_uz', label: 'Ish vaqti (UZ)', half: true },
  { key: 'hours_en', label: 'Working hours (EN)', half: true },
  { key: 'address_ru', label: 'Адрес шоурума (RU)' },
  { key: 'address_uz', label: 'Manzil (UZ)', half: true },
  { key: 'address_en', label: 'Address (EN)', half: true },
  { key: 'telegram', label: 'Telegram (ссылка)', half: true },
  { key: 'instagram', label: 'Instagram (ссылка)', half: true },
  { key: 'facebook', label: 'Facebook (ссылка)', half: true },
  { key: 'youtube', label: 'YouTube (ссылка)', half: true },
];

export function ContactsForm({ contacts }: { contacts: Contacts }) {
  const router = useRouter();
  const [c, setC] = useState(contacts);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveSetting('contacts', c);
          if (r.ok) toast.ok('Контакты сохранены');
          else toast.error(r.error);
          router.refresh();
        });
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      {CONTACT_FIELDS.map((f) => (
        <div key={f.key} className={f.half ? '' : 'sm:col-span-2'}>
          <label className="label">{f.label}</label>
          <input value={c[f.key] ?? ''} onChange={(e) => setC({ ...c, [f.key]: e.target.value })} className="input" />
        </div>
      ))}
      <div className="sm:col-span-2">
        <button disabled={pending} className="btn-primary">
          Сохранить контакты
        </button>
      </div>
    </form>
  );
}

export function TelegramButtons() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.ok(r.message ?? 'Готово');
      else toast.error(r.error ?? 'Ошибка');
    });
  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={pending} onClick={() => run(telegramTest)} className="btn-outline">
        Отправить тестовое сообщение
      </button>
      <button disabled={pending} onClick={() => run(telegramSetWebhook)} className="btn-outline">
        Подключить webhook
      </button>
    </div>
  );
}
