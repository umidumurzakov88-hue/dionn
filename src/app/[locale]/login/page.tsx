import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getDict, isLocale } from '@/i18n/config';
import { LoginForm } from '@/components/shop/login-form';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(isLocale(locale) ? locale : 'ru').auth.title, robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  const { next } = await searchParams;
  const { data } = await (await createClient()).auth.getUser();
  if (data.user) redirect(next && next.startsWith('/') && !next.startsWith('//') ? next : `/${locale}/account`);
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
