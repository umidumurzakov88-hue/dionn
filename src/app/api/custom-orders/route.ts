import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/format';
import { notifyNewCustomOrder } from '@/lib/telegram';
import { isLocale } from '@/i18n/config';

const MAX_PHOTOS = 5;
const MAX_BYTES = 4 * 1024 * 1024; // per photo (already compressed in the browser)
const MAX_OPEN = 5; // unanswered requests per customer — basic spam guard
const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic' };

/** Customer sends photos + description of the furniture they want made. Multipart form. */
export async function POST(req: NextRequest) {
  const { data: auth } = await (await createClient()).auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: 'bad' }, { status: 400 });
  if (fd.get('website')) return NextResponse.json({ ok: true }); // honeypot → silently ignore bots

  const text = (k: string, max: number) => String(fd.get(k) ?? '').trim().slice(0, max);
  const name = text('name', 120);
  const phone = normalizePhone(text('phone', 40));
  const description = text('description', 3000);
  const dimensions = text('dimensions', 300) || null;
  const l = text('locale', 5);
  const locale = isLocale(l) ? l : 'ru';
  const photos = fd.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);

  if (!name) return NextResponse.json({ error: 'name' }, { status: 400 });
  if (!phone) return NextResponse.json({ error: 'phone' }, { status: 400 });
  if (!description) return NextResponse.json({ error: 'description' }, { status: 400 });
  if (!photos.length || photos.length > MAX_PHOTOS) return NextResponse.json({ error: 'photos' }, { status: 400 });
  if (photos.some((f) => !EXT[f.type] || f.size > MAX_BYTES)) return NextResponse.json({ error: 'photoType' }, { status: 400 });

  const admin = createAdminClient();
  const { count } = await admin
    .from('custom_orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .in('status', ['new', 'quoted']);
  if ((count ?? 0) >= MAX_OPEN) return NextResponse.json({ error: 'tooMany' }, { status: 429 });

  // Upload photos with the service role (customers have no write access to storage).
  const images: string[] = [];
  for (const f of photos) {
    const path = `custom/${auth.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[f.type]}`;
    const { error } = await admin.storage.from('media').upload(path, f, { contentType: f.type, cacheControl: '31536000' });
    if (error) {
      console.error('[custom-orders] upload', error.message);
      return NextResponse.json({ error: 'server' }, { status: 500 });
    }
    images.push(admin.storage.from('media').getPublicUrl(path).data.publicUrl);
  }

  const { data: prof } = await admin.from('profiles').select('phone, full_name, telegram_chat_id').eq('id', auth.user.id).maybeSingle();
  const { data: row, error } = await admin
    .from('custom_orders')
    .insert({
      user_id: auth.user.id,
      name,
      phone,
      description,
      dimensions,
      images,
      locale,
      telegram_chat_id: prof?.telegram_chat_id ?? null,
    })
    .select('*')
    .single();
  if (error || !row) {
    console.error('[custom-orders] insert', error?.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }

  // Fill empty profile fields, like regular checkout does
  if (prof && (!prof.phone || !prof.full_name)) {
    await admin
      .from('profiles')
      .update({ phone: prof.phone || phone, full_name: prof.full_name || name })
      .eq('id', auth.user.id);
  }

  await notifyNewCustomOrder(row);
  return NextResponse.json({ ok: true, id: row.id, number: row.number });
}
