export type Locale = 'ru' | 'uz' | 'en';
export type Currency = 'UZS' | 'USD';

export type StockStatus = 'in_stock' | 'preorder' | 'out_of_stock';
export type OrderStatus = 'new' | 'confirmed' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'click' | 'payme' | 'uzum' | 'installment';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DeliveryMethod = 'delivery' | 'pickup';
export type Role = 'customer' | 'manager' | 'admin';

export const ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'delivering', 'delivered', 'cancelled'];

export interface Category {
  id: string;
  slug: string;
  parent_id: string | null;
  name_ru: string;
  name_uz: string;
  name_en: string;
  image: string | null;
  sort: number;
  is_active: boolean;
}

export interface Spec {
  ru: string;
  uz: string;
  en: string;
  value: string;
}

export interface Variant {
  id: string;
  product_id: string;
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
  sort: number;
}

export interface Product {
  id: string;
  slug: string;
  sku: string | null;
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
  stock_status: StockStatus;
  is_new: boolean;
  is_hit: boolean;
  is_active: boolean;
  installment: boolean;
  sort: number;
  created_at: string;
  product_variants?: Variant[];
  categories?: Pick<Category, 'slug' | 'name_ru' | 'name_uz' | 'name_en'> | null;
}

export interface Banner {
  id: string;
  title_ru: string;
  title_uz: string;
  title_en: string;
  subtitle_ru: string;
  subtitle_uz: string;
  subtitle_en: string;
  image: string;
  link: string | null;
  sort: number;
  is_active: boolean;
}

export interface Review {
  id: string;
  product_id: string | null;
  user_id: string | null;
  name: string;
  rating: number;
  text: string;
  is_approved: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  name: string;
  variant_name: string | null;
  image: string | null;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  number: number;
  user_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  address: string | null;
  comment: string | null;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  promo_code: string | null;
  usd_rate: number | null;
  locale: Locale;
  admin_note: string | null;
  telegram_chat_id: number | null;
  tg_token: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  telegram_chat_id: number | null;
  locale: Locale;
  created_at: string;
}

export interface PromoCode {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_total: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

export interface Contacts {
  phone: string;
  phone_raw: string;
  hours_ru: string;
  hours_uz: string;
  hours_en: string;
  address_ru: string;
  address_uz: string;
  address_en: string;
  telegram: string;
  instagram: string;
  facebook: string;
  youtube: string;
}

/** Picks the localized field, e.g. tr(product, 'name', 'uz') → product.name_uz (falls back to ru). */
export function tr<T extends object>(obj: T, field: string, locale: Locale): string {
  const rec = obj as Record<string, unknown>;
  const v = rec[`${field}_${locale}`];
  if (typeof v === 'string' && v.trim()) return v;
  return (rec[`${field}_ru`] as string) ?? '';
}

export type CustomOrderStatus = 'new' | 'quoted' | 'accepted' | 'declined';
export const CUSTOM_ORDER_STATUSES: CustomOrderStatus[] = ['new', 'quoted', 'accepted', 'declined'];

/** Individual order: customer photos → workshop quote → customer answer. */
export interface CustomOrder {
  id: string;
  number: number;
  user_id: string | null;
  name: string;
  phone: string;
  description: string;
  dimensions: string | null;
  images: string[];
  status: CustomOrderStatus;
  price: number | null;
  lead_time: string | null;
  admin_comment: string | null;
  telegram_chat_id: number | null;
  locale: Locale;
  quoted_at: string | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
}
