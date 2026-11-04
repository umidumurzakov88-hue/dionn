'use client';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useHydrated } from '@/store/shop';

/** Puts the new theme's class on <html> right away (next-themes would do it a tick later). */
function applyTheme(next: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(next);
  root.style.colorScheme = next;
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = hydrated && resolvedTheme === 'dark';

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = dark ? 'light' : 'dark';
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setTheme(next);
      return;
    }

    // Modern browsers: the new theme spreads out as a circle from the button.
    if (document.startViewTransition) {
      const r = e.currentTarget.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add('theme-instant');
      const vt = document.startViewTransition(() => {
        applyTheme(next);
        setTheme(next);
      });
      const done = () => root.classList.remove('theme-instant');
      vt.finished.then(done, done);
      setTimeout(done, 1000); // in case the transition is skipped (e.g. tab hidden)
      vt.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
          );
        })
        .catch(() => {}); // skipped transition → theme still changes, just without the circle
      return;
    }

    // Fallback: smooth colour cross-fade.
    root.classList.add('theme-fade');
    setTheme(next);
    setTimeout(() => root.classList.remove('theme-fade'), 500);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`group relative inline-flex size-[34px] items-center justify-center overflow-hidden rounded-full transition hover:bg-surface-2 active:scale-90 ${className}`}
      aria-label="Toggle theme"
      title={dark ? 'Light' : 'Dark'}
    >
      <Sun
        className={`theme-icon absolute size-[18px] transition-all duration-500 ease-out group-hover:rotate-45 ${
          dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      />
      <Moon
        className={`theme-icon absolute size-[18px] transition-all duration-500 ease-out group-hover:-rotate-12 ${
          dark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
    </button>
  );
}
