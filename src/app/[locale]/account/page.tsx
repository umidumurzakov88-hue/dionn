import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, LogOut, Send } from 'lucide-react';
import { getDict, isLocale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatPrice } from '@/lib/format';
import { ProfileForm } from '@/components/shop/profile-form';
import type { Locale, Order, Profile } from '@/lib/types';
import { isInternalEmail } from '@/lib/internal-login';

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  const locale = (isLocale(l) ? l : 'ru') as Locale;
  const t = getDict(locale);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/${locale}/login?next=/${locale}/account`);

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle(),
    supabase.from('orders').select('*, order_items(*)').eq('user_id', auth.user.id).order('created_at', { ascending: false }),
  ]);
  const p = profile as Profile | null;
  const isStaff = p?.role === 'admin' || p?.role === 'manager';

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.account.title}</h1>
        <div className="flex gap-2">
          {isStaff && (
            <Link href="/admin" className="btn-accent">
              <LayoutDashboard className="size-4" /> {t.account.admin}
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button className="btn-outline">
              <LogOut className="size-4" /> {t.common.logout}
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <aside className="card h-fit p-6">
          <h2 className="mb-4 text-lg font-bold">{t.account.profile}</h2>
          <ProfileForm id={auth.user.id} fullName={p?.full_name ?? ''} phone={p?.phone ?? ''} email={isInternalEmail(auth.user.email) ? '' : (auth.user.email ?? '')} />
          {p?.telegram_chat_id && (
            <p className="mt-4 flex items-center gap-2 text-sm text-success">
              <Send className="size-4" /> {t.account.telegramLinked}
            </p>
          )}
        </aside>

        <section>
          <h2 className="mb-4 text-lg font-bold">{t.account.orders}</h2>
          {!orders?.length ? (
            <div className="card p-10 text-center text-muted">
              {t.account.noOrders}
              <div>
                <Link href={`/${locale}/catalog`} className="btn-primary mt-5">
                  {t.cart.goCatalog}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(orders as Order[]).map((o) => (
                <Link
                  key={o.id}
                  href={`/${locale}/order/${o.id}?t=${o.tg_token}`}
                  className="card flex flex-wrap items-center justify-between gap-3 p-5 transition hover:border-fg"
                >
                  <div>
                    <p className="font-bold">
                      {t.account.order} №{o.number}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDate(o.created_at, locale)} · {o.order_items?.reduce((a, i) => a + i.qty, 0)} {t.common.pcs}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="chip bg-accent-soft text-accent">{t.status[o.status]}</span>
                    <span className="font-bold">{formatPrice(Number(o.total), 'UZS', 1, locale)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
