import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, MapPin, MessageSquare, Phone, Send, Truck, Wallet } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { PAYMENT_LABEL, PAYMENT_STATUS_LABEL, STATUS_LABEL, StatusBadge, uzs } from '@/components/admin/ui';
import { OrderControls } from '@/components/admin/order-controls';
import { formatDate } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';

export const metadata = { title: 'Заказ' };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, profile } = await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data }, { data: history }] = await Promise.all([
    supabase.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle(),
    supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: false }),
  ]);
  const o = data as Order | null;
  if (!o) notFound();

  let customerOrders = 0;
  if (o.user_id) {
    const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', o.user_id);
    customerOrders = count ?? 0;
  } else {
    const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('phone', o.phone);
    customerOrders = count ?? 0;
  }

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Все заказы
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Заказ №{o.number}</h1>
        <StatusBadge status={o.status} />
        <span className="text-sm text-muted">{formatDate(o.created_at)}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <h2 className="p-5 font-bold">Товары</h2>
            <ul className="divide-y divide-border border-t border-border">
              {o.order_items?.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    {i.product_id ? (
                      <Link href={`/admin/products/${i.product_id}`} className="font-semibold hover:text-accent">
                        {i.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">{i.name}</span>
                    )}
                    {i.variant_name && <p className="text-muted">{i.variant_name}</p>}
                    <p className="text-muted">
                      {i.qty} × {uzs(i.price)}
                    </p>
                  </div>
                  <span className="font-semibold">{uzs(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-border p-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Товары</dt>
                <dd>{uzs(o.subtotal)}</dd>
              </div>
              {Number(o.discount) > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Скидка {o.promo_code && `(${o.promo_code})`}</dt>
                  <dd>−{uzs(o.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Доставка</dt>
                <dd>Бесплатно</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-extrabold">
                <dt>Итого</dt>
                <dd>{uzs(o.total)}</dd>
              </div>
              {o.usd_rate && <p className="text-right text-xs text-muted">≈ ${Math.round(Number(o.total) / Number(o.usd_rate)).toLocaleString('en-US')} по курсу {o.usd_rate}</p>}
            </dl>
          </section>

          <section className="card grid gap-5 p-5 sm:grid-cols-2">
            <div className="space-y-3 text-sm">
              <h2 className="font-bold">Клиент</h2>
              <p className="text-base font-semibold">{o.customer_name}</p>
              <a href={`tel:${o.phone}`} className="flex items-center gap-2 hover:text-accent">
                <Phone className="size-4 text-muted" /> {o.phone}
              </a>
              {o.email && (
                <a href={`mailto:${o.email}`} className="flex items-center gap-2 hover:text-accent">
                  <Mail className="size-4 text-muted" /> {o.email}
                </a>
              )}
              <p className="flex items-center gap-2">
                <Send className="size-4 text-muted" /> {o.telegram_chat_id ? 'Telegram-уведомления подключены' : 'Telegram не подключён'}
              </p>
              <p className="text-muted">
                Заказов у клиента: <b className="text-fg">{customerOrders}</b>
                {o.user_id && (
                  <>
                    {' · '}
                    <Link href={`/admin/customers/${o.user_id}`} className="text-accent hover:underline">
                      профиль
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <h2 className="font-bold">Доставка и оплата</h2>
              <p className="flex items-start gap-2">
                <Truck className="mt-0.5 size-4 shrink-0 text-muted" /> {o.delivery_method === 'pickup' ? 'Самовывоз из шоурума' : 'Доставка курьером'}
              </p>
              {o.delivery_method === 'delivery' && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted" /> {[o.city, o.address].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="flex items-start gap-2">
                <Wallet className="mt-0.5 size-4 shrink-0 text-muted" /> {PAYMENT_LABEL[o.payment_method]} · {PAYMENT_STATUS_LABEL[o.payment_status]}
              </p>
              {o.comment && (
                <p className="flex items-start gap-2 rounded-xl bg-surface-2 p-3">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted" /> {o.comment}
                </p>
              )}
              <p className="text-xs text-muted">Язык клиента: {o.locale.toUpperCase()}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <OrderControls id={o.id} status={o.status} paymentStatus={o.payment_status} note={o.admin_note ?? ''} isAdmin={profile.role === 'admin'} />
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-bold">История статусов</h2>
            <ol className="space-y-2.5 text-sm">
              {(history ?? []).map((h) => (
                <li key={h.id} className="flex justify-between gap-3">
                  <span>{STATUS_LABEL[h.status as OrderStatus]}</span>
                  <span className="text-muted">{formatDate(h.created_at)}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
