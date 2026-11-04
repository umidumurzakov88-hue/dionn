'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { ADMIN_LOCALE_COOKIE, adminLocales } from '@/i18n/admin';
import { useAdminT } from '@/i18n/admin/provider';
import { localeShort } from '@/i18n/config';
import type { Locale } from '@/lib/types';

function saveLocale(l: Locale) {
  document.cookie = `${ADMIN_LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

/** RU / UZ / EN pill with a sliding highlight. */
export function AdminLanguageSwitch() {
  const { locale, t } = useAdminT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const idx = adminLocales.indexOf(locale);

  const pick = (l: Locale) => {
    if (l === locale) return;
    saveLocale(l);
    start(() => router.refresh());
  };

  return (
    <div
      role="radiogroup"
      aria-label={t.common.language}
      className={`relative grid grid-cols-3 rounded-full bg-surface-2 p-0.5 text-xs font-semibold transition-opacity ${pending ? 'opacity-60' : ''}`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-full bg-surface shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(${idx * 100}%)` }}
      />
      {adminLocales.map((l) => (
        <button
          key={l}
          role="radio"
          aria-checked={l === locale}
          onClick={() => pick(l)}
          className={`relative z-10 px-2.5 py-1.5 transition-colors ${l === locale ? 'text-fg' : 'text-muted hover:text-fg'}`}
        >
          {localeShort[l]}
        </button>
      ))}
    </div>
  );
}
