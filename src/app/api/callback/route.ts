import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/format';
import { escapeHtml, notifyAdmins } from '@/lib/telegram';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b || b.website) return NextResponse.json({ ok: true }); // honeypot → silently ignore bots
  const name = String(b.name ?? '').trim().slice(0, 120);
  const phone = normalizePhone(String(b.phone ?? ''));
  const comment = String(b.comment ?? '').trim().slice(0, 1000) || null;
  if (!name || !phone) return NextResponse.json({ error: 'phone' }, { status: 400 });

  const admin = createAdminClient();
  let productName: string | null = null;
  let productId: string | null = null;
  if (typeof b.productId === 'string') {
    // Quick orders are orders → require an account
    const { data: auth } = await (await createClient()).auth.getUser();
    if (!auth.user) return NextResponse.json({ error: 'auth' }, { status: 401 });
    const { data } = await admin.from('products').select('id, name_ru, slug').eq('id', b.productId).maybeSingle();
    if (data) {
      productId = data.id;
      productName = data.name_ru;
    }
  }

  const { error } = await admin.from('callback_requests').insert({ name, phone, comment, product_id: productId });
  if (error) return NextResponse.json({ error: 'server' }, { status: 500 });

  await notifyAdmins(
    [
      productName ? '⚡️ <b>Быстрый заказ</b>' : '📞 <b>Заявка на обратный звонок</b>',
      '',
      `👤 ${escapeHtml(name)}`,
      `📞 ${escapeHtml(phone)}`,
      productName ? `🛋 ${escapeHtml(productName)}` : null,
      comment ? `💬 ${escapeHtml(comment)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  );
  return NextResponse.json({ ok: true });
}
