'use client';
import { createContext, useContext, useMemo } from 'react';
import type { Locale } from '@/lib/types';
import { getAdminDict, type AdminDict } from './index';

const Ctx = createContext<{ locale: Locale; t: AdminDict } | null>(null);

export function AdminI18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: getAdminDict(locale) }), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Client components: `const { t, locale } = useAdminT()`. */
export function useAdminT() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdminT must be used inside AdminI18nProvider');
  return v;
}
