import Link from 'next/link';
import { Clock, MapPin, Phone, Send } from 'lucide-react';
import { FacebookIcon as Facebook, InstagramIcon as Instagram, YoutubeIcon as Youtube } from '@/components/ui/social-icons';
import { Logo } from '@/components/ui/logo';
import { getDict } from '@/i18n/config';
import { tr, type Category, type Contacts, type Locale } from '@/lib/types';

const PAYMENTS = ['Uzcard', 'Humo', 'Click', 'Payme', 'Uzum', 'Visa'];

export function Footer({ locale, categories, contacts }: { locale: Locale; categories: Category[]; contacts: Contacts }) {
  const t = getDict(locale);
  const L = (p: string) => `/${locale}${p}`;
  const roots = categories.filter((c) => !c.parent_id).slice(0, 7);
  const socials = [
    { href: contacts.telegram, icon: Send, label: 'Telegram' },
    { href: contacts.instagram, icon: Instagram, label: 'Instagram' },
    { href: contacts.facebook, icon: Facebook, label: 'Facebook' },
    { href: contacts.youtube, icon: Youtube, label: 'YouTube' },
  ].filter((s) => s.href);

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo href={L('')} className="h-11 w-auto" />
          <p className="text-sm text-muted">{t.home.aboutText.split('.')[0]}.</p>
          <div className="flex gap-2">
            {socials.map(({ href, icon: Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener" aria-label={label} className="grid size-10 place-items-center rounded-full border border-border hover:border-fg">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-bold">{t.common.catalog}</h4>
          <ul className="space-y-2 text-sm text-muted">
            {roots.map((c) => (
              <li key={c.id}>
                <Link href={L(`/catalog?category=${c.slug}`)} className="hover:text-fg">
                  {tr(c, 'name', locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-bold">{t.footer.customers}</h4>
          <ul className="space-y-2 text-sm text-muted">
            {(['about', 'delivery', 'payment', 'returns', 'contacts', 'privacy'] as const).map((k) => (
              <li key={k}>
                <Link href={L(`/info/${k}`)} className="hover:text-fg">
                  {t.nav[k]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-bold">{t.footer.contacts}</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={`tel:${contacts.phone_raw}`} className="font-semibold hover:text-accent">
                {contacts.phone}
              </a>
            </li>
            <li className="flex gap-3 text-muted">
              <Clock className="mt-0.5 size-4 shrink-0 text-accent" />
              {tr(contacts, 'hours', locale)}
            </li>
            <li className="flex gap-3 text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              {tr(contacts, 'address', locale)}
            </li>
          </ul>
          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">{t.footer.weAccept}</p>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENTS.map((p) => (
              <span key={p} className="rounded-md border border-border px-2 py-1 text-[11px] font-bold text-muted">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <span>
            © {new Date().getFullYear()} Dionn — Art of Furniture. {t.footer.rights}.
          </span>
          <span>{contacts.phone}</span>
        </div>
      </div>
    </footer>
  );
}
