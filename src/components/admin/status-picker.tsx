'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { updateOrderStatus } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import { useAdminT } from '@/i18n/admin/provider';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types';
import { STATUS_CLS, STATUS_DOT } from './status-colors';

/** Status chip that opens a menu to change the order status in place. */
export function StatusPicker({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const { t } = useAdminT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(status);
  const [pending, start] = useTransition();
  const box = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number; up: boolean } | null>(null);

  const [prev, setPrev] = useState(status);
  if (status !== prev) {
    setPrev(status);
    setCurrent(status);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!box.current?.contains(n) && !menu.current?.contains(n)) setOpen(false);
    };
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const up = window.innerHeight - r.bottom < 260;
    setPos({ x: r.left, y: up ? r.top - 6 : r.bottom + 6, up });
    setOpen((v) => !v);
  };

  const pick = (s: OrderStatus) => {
    setOpen(false);
    if (s === current) return;
    const before = current;
    setCurrent(s); // optimistic
    start(async () => {
      const r = await updateOrderStatus(orderId, s);
      if (r.ok) toast.ok(`${t.status[s]} ✓`);
      else {
        setCurrent(before);
        toast.error(r.error);
      }
      router.refresh();
    });
  };

  return (
    <div ref={box} className="relative inline-block">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`chip gap-1.5 transition hover:brightness-95 active:scale-95 ${STATUS_CLS[current]}`}
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : <span className={`size-1.5 rounded-full ${STATUS_DOT[current]}`} />}
        {t.status[current]}
        <ChevronDown className={`size-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && createPortal(
        <ul
          ref={menu}
          role="listbox"
          style={{ left: pos.x, top: pos.up ? undefined : pos.y, bottom: pos.up ? window.innerHeight - pos.y : undefined }}
          className={`animate-scale-in fixed z-[95] w-48 ${pos.up ? "origin-bottom-left" : "origin-top-left"} overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-2xl`}
        >
          {ORDER_STATUSES.map((s, i) => (
            <li key={s} className="animate-stagger-item" style={{ '--i': i } as React.CSSProperties}>
              <button
                type="button"
                role="option"
                aria-selected={s === current}
                onClick={() => pick(s)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-2 ${
                  s === current ? 'font-semibold' : ''
                }`}
              >
                <span className={`size-2 rounded-full ${STATUS_DOT[s]}`} />
                <span className="flex-1">{t.status[s]}</span>
                {s === current && <Check className="size-4 text-accent" />}
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  );
}
