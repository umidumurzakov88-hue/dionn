import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getDict, isLocale } from '@/i18n/config';
import { CheckoutForm } from '@/components/shop/checkout-form';
import { createClient } from '@/lib/supabase/server';
import { enabledPayments } from '@/lib/payments';
import { isInternalEmail } from '@/lib/internal-login';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(isLocale(locale) ? locale : 'ru').checkout.title, robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDict(isLocale(locale) ? locale : 'ru');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/${locale}/login?next=/${locale}/checkout`);
  let defaults = { name: '', phone: '', email: '' };
  {
    const { data: p } = await supabase.from('profiles').select('full_name, phone, email').eq('id', auth.user.id).maybeSingle();
    defaults = { name: p?.full_name ?? '', phone: p?.phone ?? '', email: p?.email ?? (isInternalEmail(auth.user.email) ? '' : (auth.user.email ?? '')) };
  }
  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.checkout.title}</h1>
      <CheckoutForm defaults={defaults} payments={enabledPayments()} />
    </div>
  );
}
