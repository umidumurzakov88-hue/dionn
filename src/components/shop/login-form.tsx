'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import { TelegramLogin } from './telegram-login';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginForm() {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const rawNext = params.get('next');
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : `/${locale}/account`;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const google = async () => {
    const { error } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } });
    if (error) toast.error(error.message);
  };

  const email = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    setLoading(true);
    const { error } = await createClient().auth.signInWithOtp({ email: value, options: { emailRedirectTo: redirectTo() } });
    setLoading(false);
    if (error) toast.error(error.message);
    else setSent(true);
  };

  return (
    <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight">{t.auth.title2}</h1>
      {next.includes('/checkout') ? (
        <p className="mt-3 rounded-xl bg-accent-soft p-3 text-sm font-medium text-accent">{t.auth.checkoutHint}</p>
      ) : (
        <p className="mt-1 text-sm text-muted">{t.auth.subtitle}</p>
      )}
      {params.get('error') && <p className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger">{t.common.error}</p>}

      <div className="mt-6">
        <TelegramLogin next={next} />
      </div>

      <button onClick={google} className="btn-outline mt-3 h-12 w-full">
        <GoogleIcon /> {t.auth.google}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted">
        <span className="h-px flex-1 bg-border" /> {t.auth.or} <span className="h-px flex-1 bg-border" />
      </div>

      {sent ? (
        <p className="rounded-xl bg-surface-2 p-4 text-sm">{t.auth.codeSent}</p>
      ) : (
        <form onSubmit={email} className="space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input name="email" type="email" required placeholder={t.auth.email} className="input pl-11" autoComplete="email" />
          </div>
          <button disabled={loading} className="btn-primary h-12 w-full">
            {loading ? t.common.loading : t.auth.sendCode}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted">{t.auth.terms}</p>
    </div>
  );
}
