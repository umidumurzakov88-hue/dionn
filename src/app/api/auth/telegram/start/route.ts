import { randomBytes } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isLocale } from '@/i18n/config';

/** Step 1: create a one-time login request and return the bot deep link. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  if (!bot || !process.env.TELEGRAM_BOT_TOKEN) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const token = randomBytes(16).toString('hex'); // 32 chars → fits Telegram's 64-char start parameter
  const admin = createAdminClient();
  // Housekeeping: drop expired requests
  await admin.from('tg_logins').delete().lt('expires_at', new Date(Date.now() - 24 * 3600_000).toISOString());
  const { error } = await admin.from('tg_logins').insert({ token, locale: isLocale(body.locale) ? body.locale : 'ru' });
  if (error) {
    console.error('[tg-login] start', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ token, link: `https://t.me/${bot}?start=login_${token}` });
}
