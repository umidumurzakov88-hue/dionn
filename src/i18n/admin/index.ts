import type { Locale } from '@/lib/types';
import core from './core';
import orders from './orders';
import products from './products';
import catalog from './catalog';
import customers from './customers';
import feedback from './feedback';
import settings from './settings';

export const ADMIN_LOCALE_COOKIE = 'ADMIN_LOCALE';
export const adminLocales: Locale[] = ['ru', 'uz', 'en'];

export function isAdminLocale(v: string | undefined | null): v is Locale {
  return !!v && (adminLocales as string[]).includes(v);
}

export function getAdminDict(locale: Locale) {
  return {
    ...core[locale],
    orders: orders[locale],
    products: products[locale],
    catalog: catalog[locale],
    customers: customers[locale],
    feedback: feedback[locale],
    settings: settings[locale],
  };
}
export type AdminDict = ReturnType<typeof getAdminDict>;

/** "{n}" placeholders → values. */
export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

/** Formats an amount in UZS: "1 250 000 сум". */
export function uzsL(v: number | string | null | undefined, locale: Locale) {
  return `${Math.round(Number(v ?? 0))
    .toLocaleString('ru-RU')
    .replace(/,/g, ' ')} ${core[locale].common.sum}`;
}

/** Locale tag for Date/Number formatting. */
export const intlLocale = (l: Locale) => (l === 'en' ? 'en-GB' : l === 'uz' ? 'uz-UZ' : 'ru-RU');
