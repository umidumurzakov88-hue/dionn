import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { ADMIN_LOCALE_COOKIE, getAdminDict, isAdminLocale } from '@/i18n/admin';
import type { Locale } from './types';

/** Admin UI language, chosen with the switcher in the admin header (cookie). */
export const getAdminLocale = cache(async (): Promise<Locale> => {
  const v = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return isAdminLocale(v) ? v : 'ru';
});

/** Server components: `const { t, locale } = await getAdminT()`. */
export async function getAdminT() {
  const locale = await getAdminLocale();
  return { t: getAdminDict(locale), locale };
}
