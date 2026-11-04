'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, CheckCheck, MessageSquare, Monitor, PhoneCall, ShoppingCart, Volume2, VolumeX } from 'lucide-react';
import { useAdminT } from '@/i18n/admin/provider';
import { uzsL } from '@/i18n/admin';
import { toast } from '@/components/ui/toast';
import type { AdminNotification } from '@/app/api/admin/notifications/route';
import type { ShellCounts } from './shell';

const POLL_MS = 15_000;
const SEEN_KEY = 'dionn-admin-notif-seen';
const SOUND_KEY = 'dionn-admin-notif-sound';
const DESKTOP_KEY = 'dionn-admin-notif-desktop';

const ICON = { order: ShoppingCart, callback: PhoneCall, review: MessageSquare } as const;
const TONE = {
  order: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
  callback: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  review: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
} as const;

/** Short two-note chime, generated (no audio file needed). */
let audioCtx: AudioContext | null = null;
function chime() {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    if (ctx.state === 'suspended') void ctx.resume();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.13;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.4);
    });
  } catch {
    /* audio not available */
  }
}

export function NotificationsBell({ onCounts }: { onCounts: (c: ShellCounts) => void }) {
  const { t, locale } = useAdminT();
  const router = useRouter();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string>('');
  const [sound, setSound] = useState(true);
  const [desktop, setDesktop] = useState(false);
  const [ring, setRing] = useState(0);
  const [now, setNow] = useState(0);
  const known = useRef<Set<string> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const prefs = useRef({ sound: true, desktop: false });

  // Load saved preferences once.
  useEffect(() => {
    const s = localStorage.getItem(SEEN_KEY) ?? new Date().toISOString();
    localStorage.setItem(SEEN_KEY, s);
    const snd = localStorage.getItem(SOUND_KEY) !== '0';
    const dsk = localStorage.getItem(DESKTOP_KEY) === '1' && 'Notification' in window && Notification.permission === 'granted';
    prefs.current = { sound: snd, desktop: dsk };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
    setSeen(s);
    setSound(snd);
    setDesktop(dsk);
  }, []);

  const label = useCallback(
    (n: AdminNotification) => (n.kind === 'order' ? t.notif.newOrder : n.kind === 'callback' ? t.notif.newCallback : t.notif.newReview),
    [t],
  );
  const detail = useCallback((n: AdminNotification) => (n.kind === 'order' ? uzsL(n.detail, locale) : n.detail), [locale]);

  const poll = useCallback(async () => {
    const res = await fetch('/api/admin/notifications', { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) return;
    const data = (await res.json()) as { counts: ShellCounts; items: AdminNotification[] };
    onCounts(data.counts);
    setItems(data.items);
    setNow(Date.now());

    if (!known.current) {
      known.current = new Set(data.items.map((i) => i.id));
      return;
    }
    const fresh = data.items.filter((i) => !known.current!.has(i.id));
    data.items.forEach((i) => known.current!.add(i.id));
    if (!fresh.length) return;

    setRing((r) => r + 1);
    if (prefs.current.sound) chime();
    fresh.slice(0, 3).forEach((n) => toast.ok(`${label(n)}: ${n.title}`));
    if (prefs.current.desktop && document.visibilityState !== 'visible') {
      fresh.slice(0, 3).forEach((n) => {
        const note = new Notification(`Dionn · ${label(n)}`, { body: `${n.title} — ${detail(n)}`, icon: '/brand/icon.png', tag: n.id });
        note.onclick = () => {
          window.focus();
          router.push(n.href);
        };
      });
    }
    router.refresh(); // update tables and dashboard numbers
  }, [onCounts, label, detail, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch; state is set after the request resolves
    void poll();
    const id = setInterval(() => document.visibilityState === 'visible' && poll(), POLL_MS);
    const onVis = () => document.visibilityState === 'visible' && poll();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [poll]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const markAll = () => {
    const stamp = new Date().toISOString();
    localStorage.setItem(SEEN_KEY, stamp);
    setSeen(stamp);
  };

  const toggleSound = () => {
    const v = !sound;
    setSound(v);
    prefs.current.sound = v;
    localStorage.setItem(SOUND_KEY, v ? '1' : '0');
    if (v) chime();
  };

  const toggleDesktop = async () => {
    if (!('Notification' in window)) return;
    let v = !desktop;
    if (v && Notification.permission !== 'granted') v = (await Notification.requestPermission()) === 'granted';
    setDesktop(v);
    prefs.current.desktop = v;
    localStorage.setItem(DESKTOP_KEY, v ? '1' : '0');
  };

  const ago = (iso: string) => {
    const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
    if (m < 1) return t.notif.justNow;
    if (m < 60) return `${m} ${t.notif.minAgo}`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} ${t.notif.hAgo}`;
    return `${Math.round(h / 24)} ${t.notif.dAgo}`;
  };

  const unread = seen ? items.filter((i) => i.at > seen).length : 0;
  const blocked = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied';
  const BellIcon = unread ? BellRing : Bell;

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-10 place-items-center rounded-full transition hover:bg-surface-2 active:scale-90"
        aria-label={t.notif.title}
        aria-expanded={open}
      >
        <BellIcon key={ring} className={`size-5 ${ring ? 'animate-bell' : ''}`} />
        {unread > 0 && (
          <span
            key={unread}
            className="animate-pop absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-bg"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {unread > 0 && <span className="absolute right-1 top-1 size-[18px] animate-ping rounded-full bg-danger/40" />}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] origin-top-right overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-bold">{t.notif.title}</p>
              {unread > 0 && (
                <p className="text-xs text-muted">
                  {unread} {t.notif.unread}
                </p>
              )}
            </div>
            <button onClick={markAll} disabled={!unread} className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40">
              <CheckCheck className="size-4" /> {t.notif.markAll}
            </button>
          </div>

          <ul className="max-h-[60vh] overflow-y-auto">
            {!items.length && <li className="px-4 py-10 text-center text-sm text-muted">{t.notif.empty}</li>}
            {items.map((n, idx) => {
              const Icon = ICON[n.kind];
              const isNew = seen && n.at > seen;
              return (
                <li key={n.id} className="animate-stagger-item" style={{ '--i': Math.min(idx, 8) } as React.CSSProperties}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 border-b border-border/60 px-4 py-3 transition hover:bg-surface-2 ${isNew ? 'bg-accent-soft/40' : ''}`}
                  >
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${TONE[n.kind]}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-xs text-muted">
                        {label(n)}
                        {isNew && <span className="size-1.5 rounded-full bg-danger" />}
                        <span className="ml-auto shrink-0">{ago(n.at)}</span>
                      </span>
                      <span className="block truncate text-sm font-semibold">{n.title}</span>
                      <span className="block truncate text-xs text-muted">{detail(n)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="grid grid-cols-2 gap-2 border-t border-border p-3 text-xs">
            <button onClick={toggleSound} className={`btn-ghost justify-start px-2 py-2 ${sound ? 'text-fg' : 'text-muted'}`}>
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              {t.notif.sound}: {sound ? t.notif.on : t.notif.off}
            </button>
            <button
              onClick={toggleDesktop}
              disabled={blocked}
              title={blocked ? t.notif.blocked : undefined}
              className={`btn-ghost justify-start px-2 py-2 ${desktop ? 'text-fg' : 'text-muted'}`}
            >
              <Monitor className="size-4" />
              <span className="truncate">{blocked ? t.notif.blocked : `${t.notif.desktop}: ${desktop ? t.notif.on : t.notif.off}`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
