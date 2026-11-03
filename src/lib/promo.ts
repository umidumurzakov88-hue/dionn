import 'server-only';
import { createAdminClient } from './supabase/admin';
import type { PromoCode } from './types';

/** Returns the discount (UZS) a promo code gives on a subtotal, or null if invalid. */
export async function evaluatePromo(code: string | null | undefined, subtotal: number) {
  if (!code) return null;
  const { data } = await createAdminClient().from('promo_codes').select('*').eq('code', code.trim().toUpperCase()).maybeSingle();
  const p = data as PromoCode | null;
  if (!p || !p.is_active) return null;
  if (p.expires_at && new Date(p.expires_at) < new Date()) return null;
  if (p.max_uses != null && p.used_count >= p.max_uses) return null;
  if (subtotal < Number(p.min_total)) return null;
  const discount = p.type === 'percent' ? Math.round((subtotal * Number(p.value)) / 100) : Number(p.value);
  return { code: p.code, discount: Math.min(discount, subtotal) };
}
