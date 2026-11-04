'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BadgePercent,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PhoneCall,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAdminT } from '@/i18n/admin/provider';
import { NotificationsBell } from './notifications';
import { AdminLanguageSwitch } from './language-switch';

export interface ShellCounts {
  orders_new: number;
  callbacks_open: number;
  reviews_pending: number;
}

export function AdminShell({
  children,
  user,
  counts: initialCounts,
}: {
  children: React.ReactNode;
  user: { email: string; name: string; role: string };
  counts: ShellCounts;
}) {
  const { t } = useAdminT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState(initialCounts);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const nav = [
    { href: '/admin', label: t.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: '/admin/orders', label: t.nav.orders, icon: ShoppingCart, badge: counts.orders_new },
    { href: '/admin/callbacks', label: t.nav.callbacks, icon: PhoneCall, badge: counts.callbacks_open },
    { href: '/admin/customers', label: t.nav.customers, icon: Users },
    { href: '/admin/products', label: t.nav.products, icon: Package },
    { href: '/admin/categories', label: t.nav.categories, icon: Tags },
    { href: '/admin/banners', label: t.nav.banners, icon: ImageIcon },
    { href: '/admin/promo', label: t.nav.promo, icon: BadgePercent },
    { href: '/admin/reviews', label: t.nav.reviews, icon: MessageSquare, badge: counts.reviews_pending },
    { href: '/admin/settings', label: t.nav.settings, icon: Settings },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo href="/admin" className="h-9 w-auto transition-transform duration-300 hover:scale-105" />
        <button className="rounded-full p-1.5 transition hover:rotate-90 hover:bg-surface-2 lg:hidden" onClick={() => setOpen(false)}>
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map(({ href, label, icon: Icon, exact, badge }, i) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{ '--i': i } as React.CSSProperties}
              className={`nav-item group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                active ? 'bg-primary text-primary-fg shadow-lg shadow-black/10' : 'text-muted hover:translate-x-1 hover:bg-surface-2 hover:text-fg'
              }`}
            >
              <Icon className={`size-[18px] transition-transform duration-300 ${active ? '' : 'group-hover:scale-110'}`} />
              <span className="flex-1">{label}</span>
              {!!badge && (
                <span key={badge} className="animate-pop rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-border p-3">
        <Link
          href="/ru"
          target="_blank"
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <ExternalLink className="size-[18px] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /> {t.common.openSite}
        </Link>
        <form action="/auth/signout" method="post">
          <button className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-danger/10 hover:text-danger">
            <LogOut className="size-[18px] transition-transform group-hover:translate-x-0.5" /> {t.common.logout}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-surface lg:block">{sidebar}</aside>
      {open && (
        <div className="animate-backdrop fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)}>
          <aside className="animate-slide-in-left h-full w-72 bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-bg/90 px-4 backdrop-blur sm:gap-3 sm:px-8">
        <button className="-ml-2 rounded-full p-2 hover:bg-surface-2 lg:hidden" onClick={() => setOpen(true)} aria-label="menu">
          <Menu className="size-6" />
        </button>
        <span className="hidden text-sm font-semibold text-muted sm:inline">{t.common.adminPanel}</span>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <AdminLanguageSwitch />
          <ThemeToggle />
          <NotificationsBell onCounts={setCounts} />
          <div className="hidden border-l border-border pl-3 text-right text-sm sm:block">
            <p className="font-semibold leading-tight">{user.name || user.email}</p>
            <p className="text-xs text-muted">{user.role === 'admin' ? t.common.admin : t.common.manager}</p>
          </div>
        </div>
      </header>
      <main key={pathname} className="animate-page p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
