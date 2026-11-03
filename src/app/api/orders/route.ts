import { NextResponse, after, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/format';
import { evaluatePromo } from '@/lib/promo';
import { notifyNewOrder } from '@/lib/telegram';
import { enabledPayments, paymentRedirectUrl } from '@/lib/payments';
import { getSettings } from '@/lib/data';
import { isLocale } from '@/i18n/config';
import type { Order, OrderItem, PaymentMethod, Product, Variant } from '@/lib/types';

interface Body {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  comment?: string;
  delivery?: 'delivery' | 'pickup';
  payment?: PaymentMethod;
  promo?: string | null;
  locale?: string;
  items?: { productId: string; variantId: string | null; qty: number }[];
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const name = clip(body.name, 120);
  const phone = normalizePhone(clip(body.phone, 40));
  const delivery = body.delivery === 'pickup' ? 'pickup' : 'delivery';
  const city = clip(body.city, 120);
  const address = clip(body.address, 300);
  const payment = enabledPayments().includes(body.payment as PaymentMethod) ? (body.payment as PaymentMethod) : 'cash';
  const locale = isLocale(body.locale) ? body.locale : 'ru';
  const items = (body.items ?? []).filter((i) => i && typeof i.productId === 'string').slice(0, 50);

  if (!name || !items.length || (delivery === 'delivery' && !address)) return NextResponse.json({ error: 'required' }, { status: 400 });
  if (!phone) return NextResponse.json({ error: 'phone' }, { status: 400 });

  // Only signed-in customers can place orders
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const admin = createAdminClient();

  // Recalculate every price on the server — never trust prices sent by the browser.
  const productIds = [...new Set(items.map((i) => i.productId))];
  const { data: products } = await admin.from('products').select('*, product_variants(*)').in('id', productIds).eq('is_active', true);
  const byId = new Map(((products as Product[]) ?? []).map((p) => [p.id, p]));

  const lines: Omit<OrderItem, 'id' | 'order_id'>[] = [];
  for (const it of items) {
    const p = byId.get(it.productId);
    if (!p || p.stock_status === 'out_of_stock') continue;
    const v: Variant | undefined = it.variantId ? p.product_variants?.find((x) => x.id === it.variantId) : undefined;
    if (it.variantId && !v) continue;
    const qty = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
    const price = Number(v?.price ?? p.price);
    lines.push({
      product_id: p.id,
      variant_id: v?.id ?? null,
      name: p.name_ru,
      variant_name: v?.name_ru ?? null,
      image: v?.image ?? p.images?.[0] ?? null,
      price,
      qty,
    });
  }
  if (!lines.length) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const promo = await evaluatePromo(body.promo, subtotal);
  const discount = promo?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const { usdRate } = await getSettings();

  const { data: order, error } = await admin
    .from('orders')
    .insert({
      user_id: auth.user.id,
      customer_name: name,
      phone,
      email: clip(body.email, 120) || null,
      city: delivery === 'delivery' ? city : null,
      address: delivery === 'delivery' ? address : null,
      comment: clip(body.comment, 1000) || null,
      delivery_method: delivery,
      payment_method: payment,
      subtotal,
      discount,
      total,
      promo_code: promo?.code ?? null,
      usd_rate: usdRate,
      locale,
    })
    .select('*')
    .single();
  if (error || !order) {
    console.error('[orders] insert', error?.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }

  const { data: savedItems, error: itemsErr } = await admin
    .from('order_items')
    .insert(lines.map((l) => ({ ...l, order_id: order.id })))
    .select('*');
  if (itemsErr) {
    console.error('[orders] items', itemsErr.message);
    await admin.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }

  await admin.from('order_status_history').insert({ order_id: order.id, status: 'new' });
  if (promo) {
    const { data: pc } = await admin.from('promo_codes').select('used_count').eq('code', promo.code).single();
    await admin.from('promo_codes').update({ used_count: (pc?.used_count ?? 0) + 1 }).eq('code', promo.code);
  }
  // Save phone/name to the user's profile if empty
  {
    const { data: prof } = await admin.from('profiles').select('phone, full_name, telegram_chat_id').eq('id', auth.user.id).single();
    if (prof?.telegram_chat_id) {
      await admin.from('orders').update({ telegram_chat_id: prof.telegram_chat_id }).eq('id', order.id);
      order.telegram_chat_id = prof.telegram_chat_id;
    }
    if (prof && (!prof.phone || !prof.full_name)) {
      await admin.from('profiles').update({ phone: prof.phone || phone, full_name: prof.full_name || name }).eq('id', auth.user.id);
    }
  }

  // Telegram notification after the response is sent (doesn't slow the customer down)
  after(() => notifyNewOrder(order as Order, (savedItems as OrderItem[]) ?? []));

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
  const successPath = `/${locale}/order/${order.id}?t=${order.tg_token}`;
  const payUrl = paymentRedirectUrl(payment, order.id, total, site + successPath);

  return NextResponse.json({ id: order.id, number: order.number, token: order.tg_token, redirect: payUrl ?? successPath });
}
