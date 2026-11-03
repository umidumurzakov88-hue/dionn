import { CheckCircle2, CircleDashed } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { PageHeader } from '@/components/admin/ui';
import { ContactsForm, TelegramButtons, UsdRateForm } from '@/components/admin/settings-forms';
import { getSettings } from '@/lib/data';
import { telegramWebhookInfo } from '../actions';

export const metadata = { title: 'Настройки' };

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

export default async function SettingsPage() {
  const { profile } = await requireStaff();
  const isAdmin = profile.role === 'admin';
  const { usdRate, contacts } = await getSettings();
  const webhook = await telegramWebhookInfo();
  const env = process.env;

  return (
    <>
      <PageHeader title="Настройки" subtitle={isAdmin ? undefined : 'Изменять настройки может только администратор'} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card space-y-4 p-6">
          <div>
            <h2 className="font-bold">Курс доллара</h2>
            <p className="text-sm text-muted">Цены хранятся в сумах. Покупатель может переключить показ цен в $ — пересчёт по этому курсу.</p>
          </div>
          {isAdmin ? <UsdRateForm rate={usdRate} /> : <p className="text-lg font-bold">1 $ = {usdRate} сум</p>}
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-bold">Интеграции</h2>
          <ul className="space-y-4">
            <Status ok label="Supabase" hint="База данных, авторизация и хранилище фото подключены" />
            <Status
              ok={!!env.TELEGRAM_BOT_TOKEN && !!env.TELEGRAM_ADMIN_CHAT_ID}
              label="Telegram-бот @Dionn_furniture_bot"
              hint={`Уведомления о заказах приходят в чат ${env.TELEGRAM_ADMIN_CHAT_ID ?? '—'}. Webhook: ${
                webhook?.url ? webhook.url : 'не подключён (нужен https-домен)'
              }${webhook?.last_error_message ? ` · ошибка: ${webhook.last_error_message}` : ''}`}
            />
            <Status ok={!!env.CLICK_SERVICE_ID} label="Click" hint="Онлайн-оплата. Появится в оформлении заказа после добавления ключей" />
            <Status ok={!!env.PAYME_MERCHANT_ID} label="Payme" hint="Онлайн-оплата. Появится в оформлении заказа после добавления ключей" />
            <Status ok={!!env.UZUM_MERCHANT_ID} label="Uzum Bank" hint="Онлайн-оплата / рассрочка после подписания договора" />
          </ul>
          <TelegramButtons />
        </section>

        <section className="card space-y-4 p-6 xl:col-span-2">
          <h2 className="font-bold">Контакты на сайте</h2>
          {isAdmin ? <ContactsForm contacts={contacts} /> : <p className="text-sm text-muted">{contacts.phone}</p>}
        </section>
      </div>
    </>
  );
}
