'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { localeShort, locales } from '@/i18n/config';
import { useI18n } from '@/i18n/provider';
import { useHydrated, useShop } from '@/store/shop';
import type { Locale } from '@/lib/types';

function rememberLocale(l: Locale) {
  document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000`;
}

export function LangSwitch({ className = '' }: { className?: string }) {
  const { locale } = useI18n();
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const go = (l: Locale) => {
    const parts = pathname.split('/');
    parts[1] = l;
    rememberLocale(l);
    const qs = params.toString();
    router.push(parts.join('/') + (qs ? `?${qs}` : ''));
  };
  return (
    <div className={`inline-flex rounded-full bg-surface-2 p-0.5 text-xs font-semibold ${className}`}>
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => go(l)}
          className={`rounded-full px-2.5 py-1 transition ${l === locale ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
        >
          {localeShort[l]}
        </button>
      ))}
    </div>
  );
}

export function CurrencySwitch({ className = '' }: { className?: string }) {
  const currency = useShop((s) => s.currency);
  const setCurrency = useShop((s) => s.setCurrency);
  const hydrated = useHydrated();
  const cur = hydrated ? currency : 'UZS';
  return (
    <div className={`inline-flex rounded-full bg-surface-2 p-0.5 text-xs font-semibold ${className}`}>
      {(['UZS', 'USD'] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={`rounded-full px-2.5 py-1 transition ${c === cur ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
        >
          {c === 'UZS' ? "sóm" : '$'}
        </button>
      ))}
    </div>
  );
}
