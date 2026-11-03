'use client';
import { createContext, useContext } from 'react';
import type { Dict } from './ru';
import type { Contacts, Locale } from '@/lib/types';
import { getDict } from './config';

interface Ctx {
  locale: Locale;
  t: Dict;
  usdRate: number;
  contacts: Contacts;
  loggedIn: boolean;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  usdRate,
  contacts,
  loggedIn,
  children,
}: Omit<Ctx, 't'> & { children: React.ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, t: getDict(locale), usdRate, contacts, loggedIn }}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
