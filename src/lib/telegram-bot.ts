import 'server-only';
import { createAdminClient } from './supabase/admin';
import { escapeHtml, sendMessage, statusMessage, tgCall } from './telegram';
import { hashCode, newCode } from './internal-login';
import type { Locale, OrderStatus } from './types';

export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TgUpdate {
  update_id: number;
  message?: {
    chat: { id: number; type: string };
    from?: TgUser;
    text?: string;
  };
}

const langOf = (code?: string): Locale => (code === 'uz' ? 'uz' : code === 'en' ? 'en' : 'ru');

const WELCOME: Record<Locale, string> = {
  ru: '👋 Здравствуйте! Это бот мебельного магазина <b>Dionn — Art of Furniture</b>.\n\nЗдесь вы получаете коды для входа на сайт и уведомления о статусе заказов.\n\n📞 +998 88 404 00 44',
  uz: "👋 Assalomu alaykum! Bu <b>Dionn — Art of Furniture</b> mebel dókoni boti.\n\nBu yerda saytga kiriş kodlari va buyurtma holati haqida xabarnomalarni olasiz.\n\n📞 +998 88 404 00 44",
  en: '👋 Hello! This is the bot of <b>Dionn — Art of Furniture</b> furniture store.\n\nHere you receive sign-in codes for the website and order status notifications.\n\n📞 +998 88 404 00 44',
};
const LINKED: Record<Locale, string> = {
  ru: '🔔 Уведомления по заказу №{n} подключены. Мы сообщим, когда статус изменится.',
  uz: "🔔 №{n} buyurtma bóyiça xabarnomalar ulandi. Holat ózgarganda xabar beramiz.",
  en: "🔔 Notifications for order #{n} are on. We'll let you know when the status changes.",
};
const NOT_FOUND: Record<Locale, string> = {
  ru: 'Ссылка устарела. Вернитесь на сайт и попробуйте ещё раз.',
  uz: "Havola eskirgan. Saytga qayting va qaytadan urinib kóring.",
  en: 'This link has expired. Go back to the website and try again.',
};
const LOGIN_CODE: Record<Locale, string> = {
  ru: '🔐 Ваш код для входа на сайт <b>Dionn</b>:\n\n<code>{code}</code>\n\nВведите его на сайте. Код действует 10 минут. Никому не сообщайте его.',
  uz: "🔐 <b>Dionn</b> saytiga kiriş kodingiz:\n\n<code>{code}</code>\n\nUni saytga kiriting. Kod 10 daqiqa amal qiladi. Heç kimga aytmang.",
  en: '🔐 Your sign-in code for <b>Dionn</b>:\n\n<code>{code}</code>\n\nEnter it on the website. The code is valid for 10 minutes. Do not share it with anyone.',
};
const LOGIN_WAIT: Record<Locale, string> = {
  ru: 'Код уже отправлен — проверьте сообщение выше. Новый код можно получить через минуту.',
  uz: "Kod allaqaçon yuborilgan — yuqoridagi xabarni tekşiring. Yangi kodni bir daqiqadan keyin oliş mumkin.",
  en: 'A code was already sent — check the message above. You can get a new one in a minute.',
};

export const LOGIN_CODE_TTL_MS = 10 * 60_000;
const RESEND_MS = 60_000;

/** Sends a login code for a pending login request. Called when the user presses Start via the login link. */
async function handleLoginStart(token: string, chatId: number, from: TgUser | undefined) {
  const admin = createAdminClient();
  const { data: req } = await admin.from('tg_logins').select('*').eq('token', token).maybeSingle();
  const lang = (req?.locale as Locale) ?? langOf(from?.language_code);
  if (!req || req.used || new Date(req.expires_at).getTime() < Date.now()) {
    await sendMessage(chatId, NOT_FOUND[lang]);
    return;
  }
  if (req.sent_at && req.chat_id === chatId && Date.now() - new Date(req.sent_at).getTime() < RESEND_MS) {
    await sendMessage(chatId, LOGIN_WAIT[lang]);
    return;
  }
  const code = newCode();
  await admin
    .from('tg_logins')
    .update({
      code_hash: hashCode(token, code),
      chat_id: chatId,
      tg_user: from ?? null,
      attempts: 0,
      sent_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + LOGIN_CODE_TTL_MS).toISOString(),
    })
    .eq('token', token);
  await sendMessage(chatId, LOGIN_CODE[lang].replace('{code}', code));
}

/** Links an order to the chat so the customer gets status updates. */
async function handleOrderStart(token: string, chatId: number, from: TgUser | undefined) {
  const admin = createAdminClient();
  const { data: order } = await admin.from('orders').select('id, number, status, locale, user_id').eq('tg_token', token).maybeSingle();
  const fallback = langOf(from?.language_code);
  if (!order) {
    await sendMessage(chatId, NOT_FOUND[fallback]);
    return;
  }
  await admin.from('orders').update({ telegram_chat_id: chatId }).eq('id', order.id);
  if (order.user_id) await admin.from('profiles').update({ telegram_chat_id: chatId }).eq('id', order.user_id);
  const lang = (order.locale as Locale) ?? fallback;
  await sendMessage(chatId, `${LINKED[lang].replace('{n}', String(order.number))}\n\n${statusMessage(lang, order.status as OrderStatus, order.number)}`);
}

/** Single entry point for every bot update — used by the webhook and by local polling. */
export async function handleUpdate(update: TgUpdate) {
  const msg = update.message;
  if (!msg?.text || msg.chat.type !== 'private') return;
  const chatId = msg.chat.id;
  const [cmd, arg] = msg.text.trim().split(/\s+/, 2);

  if (cmd === '/start' && arg?.startsWith('login_')) return handleLoginStart(arg.slice(6), chatId, msg.from);
  if (cmd === '/start' && arg && /^[0-9a-f-]{36}$/i.test(arg)) return handleOrderStart(arg, chatId, msg.from);

  if (cmd === '/start' || cmd === '/help') {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const name = msg.from?.first_name ? `, ${escapeHtml(msg.from.first_name)}` : '';
    const text = WELCOME[langOf(msg.from?.language_code)].replace('!', `${name}!`);
    await sendMessage(chatId, text, site.startsWith('https://') ? { reply_markup: { inline_keyboard: [[{ text: '🛋 Dionn', url: site }]] } } : {});
  }
}

/**
 * Local development: Telegram cannot reach localhost, so we pull updates ourselves.
 * When a webhook is registered (live site) Telegram returns 409 and this is a no-op.
 */
let pollOffset = 0;
let polling: Promise<void> | null = null;
export function pollUpdatesOnce(): Promise<void> {
  if (polling) return polling;
  polling = (async () => {
    try {
      const updates = await tgCall<TgUpdate[]>('getUpdates', { offset: pollOffset, timeout: 0, allowed_updates: ['message'] });
      for (const u of updates ?? []) {
        pollOffset = u.update_id + 1;
        await handleUpdate(u).catch((e) => console.error('[bot] update', e));
      }
    } finally {
      polling = null;
    }
  })();
  return polling;
}
