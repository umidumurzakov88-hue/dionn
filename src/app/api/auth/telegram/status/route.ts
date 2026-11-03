import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { pollUpdatesOnce } from '@/lib/telegram-bot';

/** Polled by the login page while waiting: has the bot sent the code yet? */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!/^[0-9a-f]{32}$/.test(token)) return NextResponse.json({ error: 'token' }, { status: 400 });

  // No public https URL → no webhook → fetch bot updates ourselves (local development).
  if (!(process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://')) await pollUpdatesOnce();

  const { data } = await createAdminClient().from('tg_logins').select('sent_at, expires_at, used').eq('token', token).maybeSingle();
  if (!data || data.used || new Date(data.expires_at).getTime() < Date.now()) return NextResponse.json({ expired: true });
  return NextResponse.json({ codeSent: !!data.sent_at });
}
