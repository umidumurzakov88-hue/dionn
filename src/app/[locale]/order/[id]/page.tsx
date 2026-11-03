import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CheckCircle2, Send } from 'lucide-react';
import { getDict, isLocale } from '@/i18n/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice, formatDate } from '@/lib/format';
import type { Locale, Order } from '@/lib/types';

export const metadata: Metadata = { robots: { index: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { locale: l, id } = await params;
  const { t: token } = await searchParams;
  const locale = (isLocale(l) ? l : 'ru') as Locale;
  const t = getDict(locale);
  if (!token || !/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(token)) notFound();

  // The secret token in the URL proves this visitor placed the order.
  const { data } = await createAdminClient().from('orders').select('*, order_items(*)').eq('id', id).eq('tg_token', token).maybeSingle();
  const order = data as Order | null;
  if (!order) notFound();

  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const fmt = (v: number) => formatPrice(Number(v), 'UZS', 1, locale);

  return (
    <div className="container-x max-w-3xl py-10 sm:py-16">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-16 text-success" strokeWidth={1.5} />
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.success.title}</h1>
        <p className="mt-3 text-lg">
          {t.success.number}: <span className="font-bold">№{order.number}</span>
        </p>
        <p className="mx-auto mt-2 max-w-lg text-muted">{t.success.text}</p>
      </div>

      {bot && !order.telegram_chat_id && (
        <div className="card mt-10 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#229ED9] text-white">
            <Send className="size-7" />
          </span>
          <div className="flex-1">
            <h2 className="font-bold">{t.success.tgTitle}</h2>
            <p className="text-sm text-muted">{t.success.tgText}</p>
          </div>
          <a href={`https://t.me/${bot}?start=${order.tg_token}`} target="_blank" rel="noopener" className="btn shrink-0 bg-[#229ED9] text-white hover:opacity-90">
            {t.success.tgButton}
          </a>
        </div>
      )}

      <div className="card mt-6 p-6">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span className="text-muted">{formatDate(order.created_at, locale)}</span>
          <span className="chip bg-accent-soft text-accent">{t.status[order.status]}</span>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {order.order_items?.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{i.name}</p>
                <p className="text-muted">
                  {i.variant_name ? `${i.variant_name} · ` : ''}
                  {i.qty} × {fmt(i.price)}
                </p>
              </div>
              <span className="text-sm font-semibold">{fmt(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        {order.discount > 0 && (
          <div className="flex justify-between border-t border-border pt-3 text-sm text-success">
            <span>{t.cart.discount}</span>
            <span>−{fmt(order.discount)}</span>
          </div>
        )}
        <div className="mt-3 flex items-end justify-between border-t border-border pt-4">
          <span className="font-semibold">{t.cart.total}</span>
          <span className="text-2xl font-extrabold">{fmt(order.total)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/${locale}/catalog`} className="btn-primary">
          {t.success.continue}
        </Link>
        {order.user_id && (
          <Link href={`/${locale}/account`} className="btn-outline">
            {t.success.myOrders}
          </Link>
        )}
      </div>
    </div>
  );
}
