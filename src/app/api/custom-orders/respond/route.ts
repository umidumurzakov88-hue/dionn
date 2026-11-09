import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { notifyCustomOrderAnswer } from '@/lib/telegram';

/** Customer accepts or declines the price of their own quoted individual order. */
export async function POST(req: NextRequest) {
  const { data: auth } = await (await createClient()).auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const b = await req.json().catch(() => null);
  const id = typeof b?.id === 'string' ? b.id : '';
  const accepted = b?.action === 'accept';
  if (!id || (b?.action !== 'accept' && b?.action !== 'decline')) return NextResponse.json({ error: 'bad' }, { status: 400 });

  // Only the owner, and only while the quote is waiting for an answer.
  const { data: row, error } = await createAdminClient()
    .from('custom_orders')
    .update({ status: accepted ? 'accepted' : 'declined', answered_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .eq('status', 'quoted')
    .select('*')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'server' }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'state' }, { status: 409 });

  await notifyCustomOrderAnswer(row, accepted);
  return NextResponse.json({ ok: true, status: row.status });
}
