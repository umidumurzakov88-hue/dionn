'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  BarChart3,
  ChevronRight,
  Heart,
  LayoutGrid,
  Menu,
  Phone,
  Search,
  Send,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CurrencySwitch, LangSwitch } from './switchers';
import { useI18n } from '@/i18n/provider';
import { useHydrated, useShop } from '@/store/shop';
import { tr, type Category } from '@/lib/types';
import { CallbackModal } from '@/components/shop/callback-modal';

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span key={n} className="animate-pop absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-white">
      {n > 99 ? '99+' : n}
    </span>
  );
}

export function Header({ categories }: { categories: Category[] }) {
  const { t, locale, contacts, loggedIn: isLoggedIn } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const cartCount = useShop((s) => s.cart.reduce((a, l) => a + l.qty, 0));
  const favCount = useShop((s) => s.favorites.length);
  const cmpCount = useShop((s) => s.compare.length);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [callback, setCallback] = useState(false);
  const [q, setQ] = useState('');
  const catalogRef = useRef<HTMLDivElement>(null);

  const L = (p: string) => `/${locale}${p}`;
  const roots = categories.filter((c) => !c.parent_id);
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const active = roots.find((r) => r.id === activeRoot) ?? roots[0];

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setCatalogOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!catalogOpen) return;
    const onClick = (e: MouseEvent) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) setCatalogOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [catalogOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(L(`/catalog?q=${encodeURIComponent(q.trim())}`));
  };

  const infoLinks = [
    { href: '/custom-order', label: t.custom.nav },
    { href: '/info/about', label: t.nav.about },
    { href: '/info/delivery', label: t.nav.delivery },
    { href: '/info/payment', label: t.nav.payment },
    { href: '/info/returns', label: t.nav.returns },
    { href: '/info/contacts', label: t.nav.contacts },
  ];

  const hours = tr(contacts, 'hours', locale);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      {/* Top bar */}
      <div className="hidden border-b border-border text-xs text-muted md:block">
        <div className="container-x flex h-10 items-center justify-between gap-4">
          <nav className="flex items-center gap-5">
            {infoLinks.map((l) => (
              <Link key={l.href} href={L(l.href)} className="transition hover:text-fg">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Suspense>
              <LangSwitch />
            </Suspense>
            <CurrencySwitch />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container-x flex h-16 items-center gap-3 md:h-20 md:gap-5">
        <button className="-ml-2 rounded-full p-2 hover:bg-surface-2 md:hidden" onClick={() => setMobileOpen(true)} aria-label={t.common.menu}>
          <Menu className="size-6" />
        </button>
        <Logo href={L('')} className="h-8 w-auto md:h-11" />

        <div ref={catalogRef} className="relative hidden md:block">
          <button onClick={() => setCatalogOpen((v) => !v)} className="btn-primary h-11 px-4">
            {catalogOpen ? <X className="size-4" /> : <LayoutGrid className="size-4" />}
            {t.common.catalog}
          </button>
          {catalogOpen && roots.length > 0 && (
            <div className="animate-scale-in origin-top-left absolute left-0 top-full mt-3 flex w-[760px] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
              <ul className="w-64 shrink-0 border-r border-border p-2">
                {roots.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={L(`/catalog?category=${c.slug}`)}
                      onMouseEnter={() => setActiveRoot(c.id)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active?.id === c.id ? 'bg-surface-2' : 'hover:bg-surface-2'
                      }`}
                    >
                      {tr(c, 'name', locale)}
                      <ChevronRight className="size-4 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
              {active && (
                <div className="flex-1 p-5">
                  <Link href={L(`/catalog?category=${active.slug}`)} className="text-lg font-bold hover:text-accent">
                    {tr(active, 'name', locale)}
                  </Link>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {categories
                      .filter((c) => c.parent_id === active.id)
                      .map((c) => (
                        <Link key={c.id} href={L(`/catalog?category=${c.slug}`)} className="text-sm text-muted hover:text-fg">
                          {tr(c, 'name', locale)}
                        </Link>
                      ))}
                  </div>
                  {active.image && (
                    <div className="relative mt-4 h-40 overflow-hidden rounded-xl">
                      <Image src={active.image} alt="" fill sizes="460px" className="object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="input h-11 rounded-xl pl-11"
          />
        </form>

        <div className="ml-auto hidden flex-col items-end lg:flex">
          <a href={`tel:${contacts.phone_raw}`} className="text-sm font-bold hover:text-accent">
            {contacts.phone}
          </a>
          <button onClick={() => setCallback(true)} className="text-xs text-muted underline-offset-2 hover:text-fg hover:underline">
            {t.common.callback}
          </button>
        </div>

        <nav className="ml-auto flex items-center gap-0.5 md:ml-0">
          <Link href={L('/compare')} className="relative hidden rounded-full p-2.5 hover:bg-surface-2 sm:block" title={t.common.compare}>
            <BarChart3 className="size-[22px]" />
            {hydrated && <Badge n={cmpCount} />}
          </Link>
          <Link href={L('/favorites')} className="relative rounded-full p-2.5 hover:bg-surface-2" title={t.common.favorites}>
            <Heart className="size-[22px]" />
            {hydrated && <Badge n={favCount} />}
          </Link>
          <Link href={L(isLoggedIn ? '/account' : '/login')} className="rounded-full p-2.5 hover:bg-surface-2" title={t.common.account}>
            <User className="size-[22px]" />
          </Link>
          <Link href={L('/cart')} className="relative rounded-full p-2.5 hover:bg-surface-2" title={t.common.cart}>
            <ShoppingBag className="size-[22px]" />
            {hydrated && <Badge n={cartCount} />}
          </Link>
        </nav>
      </div>

      {/* Mobile search */}
      <form onSubmit={submitSearch} className="container-x relative pb-3 md:hidden">
        <Search className="pointer-events-none absolute left-8 top-[22px] size-4 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.common.searchPlaceholder} className="input h-11 pl-11" />
      </form>

      {/* Mobile drawer (portal: the header's backdrop-blur would clip a fixed overlay to the header) */}
      {mobileOpen &&
        createPortal(
        <div className="animate-backdrop fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px] md:hidden" onClick={() => setMobileOpen(false)}>
          <aside
            className="animate-slide-in-left flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-bg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <Logo href={L('')} className="h-8 w-auto" />
              <button onClick={() => setMobileOpen(false)} className="rounded-full p-2 hover:bg-surface-2">
                <X className="size-6" />
              </button>
            </div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Suspense>
                <LangSwitch />
              </Suspense>
              <CurrencySwitch />
              <ThemeToggle />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t.common.catalog}</p>
            <ul className="mb-5 space-y-0.5">
              {roots.map((c) => (
                <li key={c.id}>
                  <Link href={L(`/catalog?category=${c.slug}`)} className="flex items-center justify-between rounded-xl px-3 py-2.5 font-medium hover:bg-surface-2">
                    {tr(c, 'name', locale)}
                    <ChevronRight className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mb-5 space-y-0.5 border-t border-border pt-4 text-sm">
              <li>
                <Link href={L(isLoggedIn ? '/account' : '/login')} className="block rounded-xl px-3 py-2 hover:bg-surface-2">
                  {t.common.account}
                </Link>
              </li>
              <li>
                <Link href={L('/compare')} className="block rounded-xl px-3 py-2 hover:bg-surface-2">
                  {t.common.compare}
                </Link>
              </li>
              {infoLinks.map((l) => (
                <li key={l.href}>
                  <Link href={L(l.href)} className="block rounded-xl px-3 py-2 hover:bg-surface-2">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto space-y-2 border-t border-border pt-4">
              <a href={`tel:${contacts.phone_raw}`} className="btn-primary w-full">
                <Phone className="size-4" /> {contacts.phone}
              </a>
              <a href={contacts.telegram} target="_blank" className="btn-outline w-full">
                <Send className="size-4" /> {t.common.writeTelegram}
              </a>
              <p className="text-center text-xs text-muted">{hours}</p>
            </div>
          </aside>
        </div>,
          document.body,
        )}

      <CallbackModal open={callback} onClose={() => setCallback(false)} />
    </header>
  );
}
