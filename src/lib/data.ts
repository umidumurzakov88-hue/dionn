import 'server-only';
import { cache } from 'react';
import { createClient as createSb } from '@supabase/supabase-js';
import type { Banner, Category, Contacts, Product, Review } from './types';

/** Anonymous client for public catalog reads (no cookies → cacheable, RLS applies). */
function publicClient() {
  return createSb(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

export const DEFAULT_CONTACTS: Contacts = {
  phone: '+998 88 404 00 44',
  phone_raw: '+998884040044',
  hours_ru: 'Ежедневно 9:00–20:00',
  hours_uz: 'Har kuni 9:00–20:00',
  hours_en: 'Daily 9:00–20:00',
  address_ru: 'г. Ташкент',
  address_uz: 'Toshkent sh.',
  address_en: 'Tashkent',
  telegram: 'https://t.me/Dionn_furniture_bot',
  instagram: '',
  facebook: '',
  youtube: '',
};

export const getSettings = cache(async () => {
  const { data } = await publicClient().from('settings').select('key,value');
  const map = new Map((data ?? []).map((r) => [r.key as string, r.value]));
  return {
    usdRate: Number(map.get('usd_rate') ?? 12800) || 12800,
    contacts: { ...DEFAULT_CONTACTS, ...((map.get('contacts') as Partial<Contacts>) ?? {}) } as Contacts,
  };
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data } = await publicClient().from('categories').select('*').eq('is_active', true).order('sort');
  return (data as Category[]) ?? [];
});

export const getBanners = cache(async (): Promise<Banner[]> => {
  const { data } = await publicClient().from('banners').select('*').eq('is_active', true).order('sort');
  return (data as Banner[]) ?? [];
});

const PRODUCT_SELECT = '*, product_variants(*), categories(slug,name_ru,name_uz,name_en)';

export interface ProductQuery {
  category?: string; // slug
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sale?: boolean;
  isNew?: boolean;
  isHit?: boolean;
  sort?: 'popular' | 'new' | 'cheap' | 'expensive';
  limit?: number;
  ids?: string[];
  excludeId?: string;
}

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const sb = publicClient();
  let query = sb.from('products').select(PRODUCT_SELECT).eq('is_active', true);

  if (q.category) {
    const cats = await getCategories();
    const root = cats.find((c) => c.slug === q.category);
    if (!root) return [];
    const ids = [root.id, ...cats.filter((c) => c.parent_id === root.id).map((c) => c.id)];
    query = query.in('category_id', ids);
  }
  if (q.ids) {
    if (!q.ids.length) return [];
    query = query.in('id', q.ids);
  }
  if (q.excludeId) query = query.neq('id', q.excludeId);
  if (q.q) {
    const s = q.q.replace(/[%,()]/g, ' ').trim();
    if (s) query = query.or(`name_ru.ilike.%${s}%,name_uz.ilike.%${s}%,name_en.ilike.%${s}%,sku.ilike.%${s}%`);
  }
  if (q.minPrice) query = query.gte('price', q.minPrice);
  if (q.maxPrice) query = query.lte('price', q.maxPrice);
  if (q.inStock) query = query.eq('stock_status', 'in_stock');
  if (q.sale) query = query.not('old_price', 'is', null);
  if (q.isNew) query = query.eq('is_new', true);
  if (q.isHit) query = query.eq('is_hit', true);

  switch (q.sort) {
    case 'new':
      query = query.order('created_at', { ascending: false });
      break;
    case 'cheap':
      query = query.order('price', { ascending: true });
      break;
    case 'expensive':
      query = query.order('price', { ascending: false });
      break;
    default:
      query = query.order('is_hit', { ascending: false }).order('sort').order('created_at', { ascending: false });
  }
  if (q.limit) query = query.limit(q.limit);

  const { data, error } = await query;
  if (error) console.error('[getProducts]', error.message);
  return ((data as Product[]) ?? []).map(normalizeProduct);
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const { data } = await publicClient().from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('is_active', true).maybeSingle();
  return data ? normalizeProduct(data as Product) : null;
});

export async function getReviews(productId?: string, limit = 20): Promise<Review[]> {
  let q = publicClient().from('reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(limit);
  if (productId) q = q.eq('product_id', productId);
  const { data } = await q;
  return (data as Review[]) ?? [];
}

function normalizeProduct(p: Product): Product {
  return {
    ...p,
    price: Number(p.price),
    old_price: p.old_price != null ? Number(p.old_price) : null,
    specs: Array.isArray(p.specs) ? p.specs : [],
    product_variants: (p.product_variants ?? [])
      .map((v) => ({ ...v, price: v.price != null ? Number(v.price) : null, old_price: v.old_price != null ? Number(v.old_price) : null }))
      .sort((a, b) => a.sort - b.sort),
  };
}
