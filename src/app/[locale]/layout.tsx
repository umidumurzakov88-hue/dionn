import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { manrope } from '../fonts';
import { Providers } from '@/components/ui/providers';
import { I18nProvider } from '@/i18n/provider';
import { getDict, isLocale, locales } from '@/i18n/config';
import { getCategories, getSettings } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { createClient } from '@/lib/supabase/server';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getDict(isLocale(locale) ? locale : 'ru');
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: t.meta.title, template: '%s — Dionn' },
    description: t.meta.description,
    icons: { icon: '/brand/icon.png' },
    openGraph: { siteName: 'Dionn', title: t.meta.title, description: t.meta.description, images: ['/demo/banner-living.jpg'] },
    alternates: { languages: { ru: '/ru', uz: '/uz', en: '/en' } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const supabase = await createClient();
  const [{ usdRate, contacts }, categories, { data: auth }] = await Promise.all([
    getSettings(),
    getCategories(),
    supabase.auth.getUser(),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning className={manrope.variable}>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <I18nProvider locale={locale} usdRate={usdRate} contacts={contacts} loggedIn={!!auth.user}>
            <Header categories={categories} isLoggedIn={!!auth.user} />
            <main className="flex-1">{children}</main>
            <Footer locale={locale} categories={categories} contacts={contacts} />
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
