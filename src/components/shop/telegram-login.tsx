'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { toast } from '@/components/ui/toast';

export function TelegramIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.9 4.3 18.8 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L7.1 12.9l-4.6-1.4c-1-.3-1-1 .2-1.5l17.9-6.9c.8-.3 1.6.2 1.3 1.2z" />
    </svg>
  );
}

/** Telegram login: open bot via one-time link → bot sends a 6-digit code → enter it here. */
export function TelegramLogin({ next }: { next: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [req, setReq] = useState<{ token: string; link: string } | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // While waiting, ask the server whether the bot has sent the code (on localhost this also pulls bot updates).
  useEffect(() => {
    if (!req || codeSent) return;
    let stop = false;
    const tick = async () => {
      const d = await fetch(`/api/auth/telegram/status?token=${req.token}`).then((r) => r.json()).catch(() => ({}));
      if (stop) return;
      if (d.codeSent) setCodeSent(true);
      else if (d.expired) {
        toast.error(t.auth.expired);
        setReq(null);
      }
    };
    const id = setInterval(tick, 2000);
    tick();
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [req, codeSent, t.auth.expired]);

  const start = async () => {
    setLoading(true);
    const res = await fetch('/api/auth/telegram/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    });
    const d = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return toast.error(t.common.error);
    setReq(d);
    setCodeSent(false);
    setCode('');
    window.open(d.link, '_blank', 'noopener');
  };

  const verify = async (value: string) => {
    if (!req) return;
    setLoading(true);
    const res = await fetch('/api/auth/telegram/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: req.token, code: value }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      router.replace(next);
      router.refresh();
      return;
    }
    setLoading(false);
    setCode('');
    if (d.error === 'expired' || d.error === 'attempts') {
      toast.error(d.error === 'expired' ? t.auth.expired : t.auth.tooMany);
      setReq(null);
      return;
    }
    toast.error(d.error === 'code' ? `${t.auth.wrongCode}${typeof d.left === 'number' ? ` · ${t.auth.attemptsLeft}: ${d.left}` : ''}` : t.common.error);
  };

  if (!req)
    return (
      <button onClick={start} disabled={loading} className="btn h-12 w-full bg-[#229ED9] text-white hover:opacity-90">
        {loading ? <Loader2 className="size-5 animate-spin" /> : <TelegramIcon />} {t.auth.telegram}
      </button>
    );

  return (
    <div className="space-y-3 rounded-2xl border border-[#229ED9]/40 bg-[#229ED9]/5 p-4">
      <p className="text-sm">{t.auth.tgStep1}</p>
      <a href={req.link} target="_blank" rel="noopener" className="btn h-11 w-full bg-[#229ED9] text-white hover:opacity-90">
        <Send className="size-4" /> {t.auth.tgOpen}
      </a>
      <p className={`flex items-center gap-2 text-sm ${codeSent ? 'font-medium text-success' : 'text-muted'}`}>
        {codeSent ? <CheckCircle2 className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
        {codeSent ? t.auth.tgCodeSent : t.auth.tgWaiting}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === 6) verify(code);
        }}
        className="space-y-3"
      >
        <input
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(v);
            if (v.length === 6) verify(v);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          aria-label={t.auth.codeLabel}
          className="input h-14 text-center font-mono text-2xl tracking-[0.5em]"
        />
        <button disabled={loading || code.length !== 6} className="btn-primary h-12 w-full">
          {loading ? t.common.loading : t.auth.verify}
        </button>
      </form>
      <button onClick={() => setReq(null)} className="btn-ghost w-full text-sm text-muted">
        {t.auth.restart}
      </button>
    </div>
  );
}
