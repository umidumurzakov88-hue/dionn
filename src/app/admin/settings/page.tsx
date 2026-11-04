import { CheckCircle2, CircleDashed } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { getAdminT } from '@/lib/admin-i18n';
import { fmt } from '@/i18n/admin';
import { PageHeader } from '@/components/admin/ui';
import { ContactsForm, TelegramButtons, UsdRateForm } from '@/components/admin/settings-forms';
import { getSettings } from '@/lib/data';
import { telegramWebhookInfo } from '../actions';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.settings.title };
}

function Status({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-3">
      {ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted" />}
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted">{hint}</p>
      </div>
    </li>
  );
}

const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

export default async function SettingsPage() {
  const { profile } = await requireStaff();
  const { t } = await getAdminT();
  const s = t.settings;
  const isAdmin = profile.role === 'admin';
  const { usdRate, contacts } = await getSettings();
  const webhook = await telegramWebhookInfo();
  const env = process.env;

  const telegramHint =
    fmt(s.telegramHint, {
      chat: env.TELEGRAM_ADMIN_CHAT_ID ?? '—',
      webhook: webhook?.url ? webhook.url : s.webhookNotConnected,
    }) + (webhook?.last_error_message ? ` · ${fmt(s.webhookError, { error: webhook.last_error_message })}` : '');

  return (
    <>
      <PageHeader title={s.title} subtitle={isAdmin ? undefined : s.adminOnly} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card animate-stagger-item space-y-4 p-6" style={stagger(0)}>
          <div>
            <h2 className="font-bold">{s.usdRate}</h2>
            <p className="text-sm text-muted">{s.usdRateHint}</p>
          </div>
          {isAdmin ? (
            <UsdRateForm rate={usdRate} />
          ) : (
            <p className="text-lg font-bold">
              1 $ = {usdRate} {t.common.sum}
            </p>
          )}
        </section>

        <section className="card animate-stagger-item space-y-4 p-6" style={stagger(1)}>
          <h2 className="font-bold">{s.integrations}</h2>
          <ul className="space-y-4">
            <Status ok label="Supabase" hint={s.supabaseHint} />
            <Status ok={!!env.TELEGRAM_BOT_TOKEN && !!env.TELEGRAM_ADMIN_CHAT_ID} label={s.telegramLabel} hint={telegramHint} />
            <Status ok={!!env.CLICK_SERVICE_ID} label="Click" hint={s.onlinePaymentHint} />
            <Status ok={!!env.PAYME_MERCHANT_ID} label="Payme" hint={s.onlinePaymentHint} />
            <Status ok={!!env.UZUM_MERCHANT_ID} label="Uzum Bank" hint={s.uzumHint} />
          </ul>
          <TelegramButtons />
        </section>

        <section className="card animate-stagger-item space-y-4 p-6 xl:col-span-2" style={stagger(2)}>
          <h2 className="font-bold">{s.siteContacts}</h2>
          {isAdmin ? <ContactsForm contacts={contacts} /> : <p className="text-sm text-muted">{contacts.phone}</p>}
        </section>
      </div>
    </>
  );
}
