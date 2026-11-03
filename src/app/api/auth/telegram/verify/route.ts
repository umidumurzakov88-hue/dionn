import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashCode, INTERNAL_EMAIL_DOMAIN, sameHash, signInInternal } from '@/lib/internal-login';
import type { TgUser } from '@/lib/telegram-bot';

const MAX_ATTEMPTS = 5;

/** Step 3: check the code from the bot, then sign the customer in (account is created on first login). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? '');
  const code = String(body.code ?? '').replace(/\D/g, '');
  if (!/^[0-9a-f]{32}$/.test(token) || code.length !== 6) return NextResponse.json({ error: 'code' }, { status: 400 });

  const admin = createAdminClient();
  const { data: req0 } = await admin.from('tg_logins').select('*').eq('token', token).maybeSingle();
  if (!req0 || req0.used || !req0.code_hash || new Date(req0.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'expired' }, { status: 400 });
  }
  if (req0.attempts >= MAX_ATTEMPTS) return NextResponse.json({ error: 'attempts' }, { status: 429 });

  if (!sameHash(req0.code_hash, hashCode(token, code))) {
    await admin.from('tg_logins').update({ attempts: req0.attempts + 1 }).eq('token', token);
    return NextResponse.json({ error: 'code', left: MAX_ATTEMPTS - req0.attempts - 1 }, { status: 400 });
  }
  await admin.from('tg_logins').update({ used: true }).eq('token', token);

  const tg = (req0.tg_user ?? {}) as TgUser;
  const tgId = tg.id ?? req0.chat_id;
  const fullName = [tg.first_name, tg.last_name].filter(Boolean).join(' ') || null;

  try {
    const user = await signInInternal(`tg${tgId}@${INTERNAL_EMAIL_DOMAIN}`, {
      full_name: fullName,
      telegram_id: tgId,
      telegram_username: tg.username ?? null,
    });
    // Profile: no internal e-mail, keep the name, link Telegram for order notifications.
    const { data: prof } = await admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
    await admin
      .from('profiles')
      .update({ email: null, telegram_chat_id: req0.chat_id, ...(prof?.full_name ? {} : { full_name: fullName }) })
      .eq('id', user.id);
  } catch (e) {
    console.error('[tg-login]', e);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
