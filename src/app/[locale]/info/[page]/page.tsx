import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, MapPin, Phone, Send } from 'lucide-react';
import { getDict, isLocale } from '@/i18n/config';
import { getSettings } from '@/lib/data';
import { tr, type Locale } from '@/lib/types';

const PAGES = ['about', 'delivery', 'payment', 'returns', 'contacts', 'privacy'] as const;
type PageKey = (typeof PAGES)[number];

export function generateStaticParams() {
  return PAGES.map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; page: string }> }): Promise<Metadata> {
  const { locale, page } = await params;
  const t = getDict(isLocale(locale) ? locale : 'ru');
  return PAGES.includes(page as PageKey) ? { title: t.pages[page as PageKey].title } : {};
}

export default async function InfoPage({ params }: { params: Promise<{ locale: string; page: string }> }) {
  const { locale: l, page } = await params;
  const locale = (isLocale(l) ? l : 'ru') as Locale;
  if (!PAGES.includes(page as PageKey)) notFound();
  const t = getDict(locale);
  const content = t.pages[page as PageKey];
  const { contacts } = await getSettings();

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {PAGES.map((k) => (
            <Link
              key={k}
              href={`/${locale}/info/${k}`}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium ${k === page ? 'bg-primary text-primary-fg' : 'hover:bg-surface-2'}`}
            >
              {t.nav[k]}
            </Link>
          ))}
        </nav>
        <article className="card p-6 sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight">{content.title}</h1>
          <div className="mt-6 space-y-4 leading-relaxed text-muted">
            {content.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {page === 'contacts' && (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              <li className="flex gap-3 rounded-2xl bg-surface-2 p-5">
                <Phone className="size-5 text-accent" />
                <a href={`tel:${contacts.phone_raw}`} className="font-bold hover:text-accent">
                  {contacts.phone}
                </a>
              </li>
              <li className="flex gap-3 rounded-2xl bg-surface-2 p-5">
                <Send className="size-5 text-accent" />
                <a href={contacts.telegram} target="_blank" rel="noopener" className="font-bold hover:text-accent">
                  Telegram
                </a>
              </li>
              <li className="flex gap-3 rounded-2xl bg-surface-2 p-5">
                <Clock className="size-5 text-accent" /> {tr(contacts, 'hours', locale)}
              </li>
              <li className="flex gap-3 rounded-2xl bg-surface-2 p-5">
                <MapPin className="size-5 text-accent" /> {tr(contacts, 'address', locale)}
              </li>
            </ul>
          )}
        </article>
      </div>
    </div>
  );
}
