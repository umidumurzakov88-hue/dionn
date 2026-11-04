'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Dict } from './ru';
import type { Contacts, Locale } from '@/lib/types';
import { getDict } from './config';
import { createClient } from '@/lib/supabase/client';

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
  children,
}: Omit<Ctx, 't' | 'loggedIn'> & { children: React.ReactNode }) {
  // Login state is read in the browser (from the session cookie, no network call)
  // so the server-rendered storefront stays the same for everyone and can be cached.
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const auth = createClient().auth;
    auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data } = auth.onAuthStateChange((_e, session) => setLoggedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  // Server-side logins (Telegram, OAuth callback) only set cookies — re-check after navigation.
  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
  }, [pathname]);

  return (
    <I18nContext.Provider value={{ locale, t: getDict(locale), usdRate, contacts, loggedIn }}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
