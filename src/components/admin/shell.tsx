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

export interface ShellCounts {
  orders_new: number;
  callbacks_open: number;
  reviews_pending: number;
}

export function AdminShell({
  children,
  user,
  counts,
}: {
  children: React.ReactNode;
  user: { email: string; name: string; role: string };
  counts: ShellCounts;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const nav = [
    { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
    { href: '/admin/orders', label: 'Заказы', icon: ShoppingCart, badge: counts.orders_new },
    { href: '/admin/callbacks', label: 'Заявки', icon: PhoneCall, badge: counts.callbacks_open },
    { href: '/admin/customers', label: 'Клиенты', icon: Users },
    { href: '/admin/products', label: 'Товары', icon: Package },
    { href: '/admin/categories', label: 'Категории', icon: Tags },
    { href: '/admin/banners', label: 'Баннеры', icon: ImageIcon },
    { href: '/admin/promo', label: 'Промокоды', icon: BadgePercent },
    { href: '/admin/reviews', label: 'Отзывы', icon: MessageSquare, badge: counts.reviews_pending },
    { href: '/admin/settings', label: 'Настройки', icon: Settings },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo href="/admin" className="h-9 w-auto" />
        <button className="rounded-full p-1.5 hover:bg-surface-2 lg:hidden" onClick={() => setOpen(false)}>
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-surface-2 hover:text-fg'
              }`}
            >
              <Icon className="size-[18px]" />
              <span className="flex-1">{label}</span>
              {!!badge && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">{badge}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-border p-3">
        <Link href="/ru" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-fg">
          <ExternalLink className="size-[18px]" /> Открыть сайт
        </Link>
        <form action="/auth/signout" method="post">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-fg">
            <LogOut className="size-[18px]" /> Выйти
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-surface lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="animate-fade-in h-full w-72 bg-surface" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur sm:px-8">
        <button className="-ml-2 rounded-full p-2 hover:bg-surface-2 lg:hidden" onClick={() => setOpen(true)} aria-label="menu">
          <Menu className="size-6" />
        </button>
        <span className="text-sm font-semibold text-muted">Админ-панель</span>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden text-right text-sm sm:block">
            <p className="font-semibold leading-tight">{user.name || user.email}</p>
            <p className="text-xs text-muted">{user.role === 'admin' ? 'Администратор' : 'Менеджер'}</p>
          </div>
        </div>
      </header>
      <main className="p-4 sm:p-8">{children}</main>
    </div>
  );
}
