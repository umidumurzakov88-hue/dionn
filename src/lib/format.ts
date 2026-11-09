import type { Currency, Locale, Product, Variant } from './types';

const SUM_LABEL: Record<Locale, string> = { ru: 'сум', uz: "sóm", en: 'UZS' };

/** Format an amount stored in UZS in the selected display currency. */
export function formatPrice(amountUzs: number, currency: Currency, usdRate: number, locale: Locale): string {
  if (currency === 'USD') {
    const usd = amountUzs / (usdRate || 1);
    return '$' + usd.toLocaleString('en-US', { maximumFractionDigits: usd < 100 ? 2 : 0 });
  }
  const n = Math.round(amountUzs).toLocaleString('ru-RU').replace(/,/g, ' ');
  return `${n} ${SUM_LABEL[locale]}`;
}

/** Effective unit price for a product + optional variant. */
export function unitPrice(product: Pick<Product, 'price' | 'old_price'>, variant?: Pick<Variant, 'price' | 'old_price'> | null) {
  const price = variant?.price ?? product.price;
  const old = variant?.price != null ? variant.old_price : product.old_price;
  return { price: Number(price), oldPrice: old != null && Number(old) > Number(price) ? Number(old) : null };
}

export function discountPercent(price: number, oldPrice: number | null) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

export function formatDate(iso: string, locale: Locale = 'ru', withTime = true) {
  const d = new Date(iso);
  return d.toLocaleString(locale === 'en' ? 'en-GB' : locale === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Tashkent',
  });
}

export function slugify(input: string) {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
  };
  return input
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Normalizes an Uzbek phone number to +998XXXXXXXXX, or null if invalid. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const d = digits.length === 9 ? '998' + digits : digits;
  return /^998\d{9}$/.test(d) ? '+' + d : null;
}
