import type { Locale } from '@/lib/types';
import ru from './ru';
import uz from './uz';
import en from './en';

export const locales: Locale[] = ['ru', 'uz', 'en'];
export const defaultLocale: Locale = 'ru';
export const localeNames: Record<Locale, string> = { ru: 'Русский', uz: "O'zbekcha", en: 'English' };
export const localeShort: Record<Locale, string> = { ru: 'RU', uz: 'UZ', en: 'EN' };

const dictionaries = { ru, uz, en };

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (locales as string[]).includes(v);
}

export function getDict(locale: Locale) {
  return dictionaries[locale] ?? ru;
}
