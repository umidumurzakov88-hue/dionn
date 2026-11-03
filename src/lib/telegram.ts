import 'server-only';
import type { Locale, Order, OrderItem, OrderStatus } from './types';
import { formatPrice } from './format';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT = process.env.TELEGRAM_ADMIN_CHAT_ID;

export function escapeHtml(s: string | null | undefined) {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function tgCall<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T | null> {
  if (!TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const json = await res.json();
    if (!json.ok) console.error('[telegram]', method, json.description);
    return json.ok ? (json.result as T) : null;
  } catch (e) {
    console.error('[telegram]', method, e);
    return null;
  }
}

export function sendMessage(chatId: string | number, html: string, extra: Record<string, unknown> = {}) {
  return tgCall('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });
}

/** Admin chat IDs (comma-separated list supported). */
function adminChats() {
  return (ADMIN_CHAT ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

export async function notifyAdmins(html: string, extra: Record<string, unknown> = {}) {
  await Promise.all(adminChats().map((id) => sendMessage(id, html, extra)));
}

const PAY_LABEL: Record<string, string> = {
  cash: '💵 Наличные при получении',
  card: '💳 Карта при получении',
  click: 'Click',
  payme: 'Payme',
  uzum: 'Uzum Bank',
  installment: '📆 Рассрочка',
};

export async function notifyNewOrder(order: Order, items: OrderItem[]) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const lines = items
    .map(
      (i) =>
        `• ${escapeHtml(i.name)}${i.variant_name ? ` <i>(${escapeHtml(i.variant_name)})</i>` : ''} × ${i.qty} = ${formatPrice(
          i.price * i.qty,
          'UZS',
          1,
          'ru',
        )}`,
    )
    .join('\n');
  const html = [
    `🛒 <b>Новый заказ №${order.number}</b>`,
    '',
    `👤 ${escapeHtml(order.customer_name)}`,
    `📞 ${escapeHtml(order.phone)}`,
    order.email ? `✉️ ${escapeHtml(order.email)}` : null,
    order.delivery_method === 'pickup'
      ? '🏬 Самовывоз'
      : `🚚 ${escapeHtml([order.city, order.address].filter(Boolean).join(', '))}`,
    `💰 ${PAY_LABEL[order.payment_method] ?? order.payment_method}`,
    order.comment ? `💬 ${escapeHtml(order.comment)}` : null,
    '',
    lines,
    '',
    order.discount > 0 ? `Скидка: −${formatPrice(order.discount, 'UZS', 1, 'ru')}${order.promo_code ? ` (${escapeHtml(order.promo_code)})` : ''}` : null,
    `<b>Итого: ${formatPrice(order.total, 'UZS', 1, 'ru')}</b>`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  const markup = site.startsWith('https://')
    ? { reply_markup: { inline_keyboard: [[{ text: 'Открыть в админке', url: `${site}/admin/orders/${order.id}` }]] } }
    : {};
  await notifyAdmins(html, markup);
}

const STATUS_TEXT: Record<Locale, Record<OrderStatus, string>> = {
  ru: {
    new: '🆕 Ваш заказ №{n} принят.',
    confirmed: '✅ Ваш заказ №{n} подтверждён. Мы готовим его к отправке.',
    delivering: '🚚 Ваш заказ №{n} передан в доставку.',
    delivered: '🎉 Ваш заказ №{n} доставлен. Спасибо, что выбрали Dionn!',
    cancelled: '❌ Ваш заказ №{n} отменён. Если это ошибка — свяжитесь с нами: +998 88 404 00 44',
  },
  uz: {
    new: '🆕 №{n} buyurtmangiz qabul qilindi.',
    confirmed: "✅ №{n} buyurtmangiz tasdiqlandi. Uni jo'natishga tayyorlayapmiz.",
    delivering: '🚚 №{n} buyurtmangiz yetkazib berishga topshirildi.',
    delivered: '🎉 №{n} buyurtmangiz yetkazildi. Dionn ni tanlaganingiz uchun rahmat!',
    cancelled: "❌ №{n} buyurtmangiz bekor qilindi. Agar bu xato bo'lsa — biz bilan bog'laning: +998 88 404 00 44",
  },
  en: {
    new: '🆕 Your order #{n} has been received.',
    confirmed: "✅ Your order #{n} is confirmed. We're preparing it for shipping.",
    delivering: '🚚 Your order #{n} is out for delivery.',
    delivered: '🎉 Your order #{n} has been delivered. Thank you for choosing Dionn!',
    cancelled: '❌ Your order #{n} has been cancelled. If this is a mistake, contact us: +998 88 404 00 44',
  },
};

export function statusMessage(locale: Locale, status: OrderStatus, number: number) {
  return (STATUS_TEXT[locale] ?? STATUS_TEXT.ru)[status].replace('{n}', String(number));
}

export async function notifyCustomerStatus(order: Pick<Order, 'telegram_chat_id' | 'locale' | 'number'>, status: OrderStatus) {
  if (!order.telegram_chat_id) return false;
  const res = await sendMessage(order.telegram_chat_id, statusMessage(order.locale, status, order.number));
  return !!res;
}
