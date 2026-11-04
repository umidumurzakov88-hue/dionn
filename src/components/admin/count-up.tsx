'use client';
import { useEffect, useRef, useState } from 'react';
import { useAdminT } from '@/i18n/admin/provider';
import { uzsL } from '@/i18n/admin';

/** Number that counts up from 0 when it first appears. */
export function CountUp({ value, money = false, duration = 1100 }: { value: number; money?: boolean; duration?: number }) {
  const { locale } = useAdminT();
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const target = Number(value) || 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target); // eslint-disable-line react-hooks/set-state-in-effect -- no animation wanted
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {money ? uzsL(n, locale) : Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ')}
    </span>
  );
}
