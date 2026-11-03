import { NextResponse, type NextRequest } from 'next/server';
import { handleUpdate, type TgUpdate } from '@/lib/telegram-bot';

/** Telegram → site. Registered via Admin → Настройки → «Подключить webhook» (needs a public https domain). */
export async function POST(req: NextRequest) {
  // Telegram sends back the secret we registered with setWebhook — reject anything else.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  if (update) await handleUpdate(update).catch((e) => console.error('[bot] webhook', e));
  return NextResponse.json({ ok: true });
}
