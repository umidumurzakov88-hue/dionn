import type { Metadata } from 'next';
import { getDict, isLocale } from '@/i18n/config';
import { CartView } from '@/components/shop/cart-view';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(isLocale(locale) ? locale : 'ru').cart.title, robots: { index: false } };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDict(isLocale(locale) ? locale : 'ru');
  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.cart.title}</h1>
      <CartView />
    </div>
  );
}
