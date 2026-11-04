'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireStaff } from '@/lib/admin-auth';
import { notifyCustomerStatus, notifyAdmins, tgCall } from '@/lib/telegram';
import { createAdminClient } from '@/lib/supabase/admin';
import { ORDER_STATUSES, type OrderStatus, type Spec } from '@/lib/types';
import { slugify } from '@/lib/format';
import { getAdminT } from '@/lib/admin-i18n';

/** Localized messages returned to the admin UI. */
const msg = async () => (await getAdminT()).t.settings.actions;

type Result = { ok: true; id?: string; message?: string } | { ok: false; error: string };

const refreshShop = () => revalidatePath('/', 'layout');

// ---------------------------------------------------------------- Orders
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Result> {
  const { supabase, user } = await requireStaff();
  if (!ORDER_STATUSES.includes(status)) return { ok: false, error: (await msg()).badStatus };
  const { data: order, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select('*').single();
  if (error) return { ok: false, error: error.message };
  await supabase.from('order_status_history').insert({ order_id: orderId, status, changed_by: user.id });
  const sent = await notifyCustomerStatus(order, status);
  revalidatePath('/admin', 'layout');
  return { ok: true, message: sent ? (await msg()).statusUpdatedNotified : (await msg()).statusUpdated };
}

export async function updateOrderMeta(orderId: string, patch: { admin_note?: string; payment_status?: string }): Promise<Result> {
  const { supabase } = await requireStaff();
  const allowed: Record<string, unknown> = {};
  if (typeof patch.admin_note === 'string') allowed.admin_note = patch.admin_note.slice(0, 2000);
  if (patch.payment_status && ['pending', 'paid', 'failed', 'refunded'].includes(patch.payment_status)) allowed.payment_status = patch.payment_status;
  const { error } = await supabase.from('orders').update(allowed).eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function deleteOrder(orderId: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------- Products
export interface ProductInput {
  id?: string;
  slug: string;
  sku: string;
  category_id: string | null;
  name_ru: string;
  name_uz: string;
  name_en: string;
  description_ru: string;
  description_uz: string;
  description_en: string;
  price: number;
  old_price: number | null;
  images: string[];
  specs: Spec[];
  stock_status: 'in_stock' | 'preorder' | 'out_of_stock';
  is_new: boolean;
  is_hit: boolean;
  is_active: boolean;
  installment: boolean;
  sort: number;
  variants: {
    id?: string;
    group_name: string;
    name_ru: string;
    name_uz: string;
    name_en: string;
    color_hex: string | null;
    price: number | null;
    old_price: number | null;
    image: string | null;
    sku: string | null;
    stock: number;
  }[];
}

export async function saveProduct(input: ProductInput): Promise<Result> {
  const { supabase } = await requireStaff();
  if (!input.name_ru.trim()) return { ok: false, error: (await msg()).nameRequired };
  if (!(input.price >= 0)) return { ok: false, error: (await msg()).priceRequired };

  const row = {
    slug: slugify(input.slug || input.name_ru) || `product-${Date.now()}`,
    sku: input.sku || null,
    category_id: input.category_id || null,
    name_ru: input.name_ru.trim(),
    name_uz: input.name_uz.trim(),
    name_en: input.name_en.trim(),
    description_ru: input.description_ru,
    description_uz: input.description_uz,
    description_en: input.description_en,
    price: input.price,
    old_price: input.old_price && input.old_price > input.price ? input.old_price : null,
    images: input.images.filter(Boolean),
    specs: input.specs.filter((s) => s.ru.trim() && s.value.trim()),
    stock_status: input.stock_status,
    is_new: input.is_new,
    is_hit: input.is_hit,
    is_active: input.is_active,
    installment: input.installment,
    sort: input.sort || 0,
  };

  let id = input.id;
  if (id) {
    const { error } = await supabase.from('products').update(row).eq('id', id);
    if (error) return { ok: false, error: error.code === '23505' ? (await msg()).slugTaken : error.message };
  } else {
    const { data, error } = await supabase.from('products').insert(row).select('id').single();
    if (error) return { ok: false, error: error.code === '23505' ? (await msg()).slugTaken : error.message };
    id = data.id;
  }

  // Sync variants: delete removed, upsert the rest
  const keepIds = input.variants.map((v) => v.id).filter(Boolean) as string[];
  let del = supabase.from('product_variants').delete().eq('product_id', id!);
  if (keepIds.length) del = del.not('id', 'in', `(${keepIds.join(',')})`);
  await del;
  const variantRows = input.variants
    .filter((v) => v.name_ru.trim())
    .map((v, i) => ({
      ...(v.id ? { id: v.id } : {}),
      product_id: id,
      group_name: v.group_name || 'color',
      name_ru: v.name_ru.trim(),
      name_uz: v.name_uz.trim(),
      name_en: v.name_en.trim(),
      color_hex: v.color_hex || null,
      price: v.price || null,
      old_price: v.old_price || null,
      image: v.image || null,
      sku: v.sku || null,
      stock: v.stock || 0,
      sort: i,
    }));
  const existing = variantRows.filter((v) => 'id' in v);
  const fresh = variantRows.filter((v) => !('id' in v));
  if (existing.length) {
    const { error } = await supabase.from('product_variants').upsert(existing);
    if (error) return { ok: false, error: error.message };
  }
  if (fresh.length) {
    const { error } = await supabase.from('product_variants').insert(fresh);
    if (error) return { ok: false, error: error.message };
  }

  refreshShop();
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<Result> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  refreshShop();
  return { ok: true };
}

export async function toggleProductActive(id: string, is_active: boolean): Promise<Result> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  refreshShop();
  return { ok: true };
}

// ---------------------------------------------------------------- Generic simple tables
type SimpleTable = 'categories' | 'banners' | 'promo_codes';

export async function saveRow(table: SimpleTable, row: Record<string, unknown>, key = 'id'): Promise<Result> {
  const { supabase } = await requireStaff();
  const data = { ...row };
  if (table === 'categories') data.slug = slugify(String(data.slug || data.name_ru || '')) || `cat-${Date.now()}`;
  if (table === 'promo_codes') data.code = String(data.code ?? '').trim().toUpperCase();
  for (const k of Object.keys(data)) if (data[k] === '') data[k] = null;
  if (table === 'categories') {
    data.name_uz ??= '';
    data.name_en ??= '';
  }
  if (table === 'banners') {
    for (const k of ['title_ru', 'title_uz', 'title_en', 'subtitle_ru', 'subtitle_uz', 'subtitle_en']) data[k] ??= '';
  }

  const isUpdate = key === 'id' ? !!data.id : !!row.__existing;
  delete data.__existing;
  if (!isUpdate && key === 'id') delete data.id;
  const q = isUpdate ? supabase.from(table).update(data).eq(key, data[key] as string) : supabase.from(table).insert(data);
  const { error } = await q;
  if (error) return { ok: false, error: error.code === '23505' ? (await msg()).duplicateValue : error.message };
  refreshShop();
  return { ok: true };
}

export async function deleteRow(table: SimpleTable | 'reviews' | 'callback_requests', value: string, key = 'id'): Promise<Result> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from(table).delete().eq(key, value);
  if (error) return { ok: false, error: error.message };
  refreshShop();
  return { ok: true };
}

export async function setReviewApproved(id: string, is_approved: boolean): Promise<Result> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from('reviews').update({ is_approved }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  refreshShop();
  return { ok: true };
}

export async function setCallbackHandled(id: string, handled: boolean): Promise<Result> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from('callback_requests').update({ handled }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------- Customers / roles
export async function setUserRole(userId: string, role: 'customer' | 'manager' | 'admin'): Promise<Result> {
  const { supabase, user } = await requireAdmin();
  if (userId === user.id && role !== 'admin') return { ok: false, error: (await msg()).cannotDemoteSelf };
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/customers', 'layout');
  return { ok: true };
}

// ---------------------------------------------------------------- Settings
export async function saveSetting(key: 'usd_rate' | 'contacts', value: unknown): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('settings').upsert({ key, value });
  if (error) return { ok: false, error: error.message };
  refreshShop();
  return { ok: true };
}

export async function telegramTest(): Promise<Result> {
  await requireStaff();
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_ADMIN_CHAT_ID) return { ok: false, error: (await msg()).telegramNotConfigured };
  await notifyAdmins('✅ <b>Dionn</b>: тестовое уведомление из админ-панели. Бот работает!');
  return { ok: true, message: (await msg()).testSent };
}

/** Registers this site's webhook with Telegram (needs a public https URL). */
export async function telegramSetWebhook(): Promise<Result> {
  await requireAdmin();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (!site.startsWith('https://')) return { ok: false, error: (await msg()).siteUrlNotHttps };
  const res = await tgCall('setWebhook', {
    url: `${site}/api/telegram/webhook`,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  });
  await tgCall('setMyCommands', { commands: [{ command: 'start', description: 'Начать / Boshlash / Start' }] });
  return res ? { ok: true, message: (await msg()).webhookConnected } : { ok: false, error: (await msg()).telegramRejected };
}

export async function telegramWebhookInfo() {
  await requireStaff();
  return tgCall<{ url: string; pending_update_count: number; last_error_message?: string }>('getWebhookInfo', {});
}

/** Used by settings page to count users etc. without exposing service key to the client. */
export async function adminEmails(): Promise<string[]> {
  await requireAdmin();
  const { data } = await createAdminClient().from('admin_emails').select('email');
  return (data ?? []).map((r) => r.email);
}
