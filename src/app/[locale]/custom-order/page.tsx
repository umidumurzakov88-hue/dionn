import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, MessageSquareText, BadgeCheck } from 'lucide-react';
import { getDict, isLocale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import { CustomOrderForm } from '@/components/shop/custom-order-form';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getDict(isLocale(locale) ? locale : 'ru');
  return { title: t.custom.title, description: t.custom.subtitle };
}

export default async function CustomOrderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDict(isLocale(locale) ? locale : 'ru');
  const c = t.custom;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  let defaults = { name: '', phone: '' };
  if (auth.user) {
    const { data: p } = await supabase.from('profiles').select('full_name, phone').eq('id', auth.user.id).maybeSingle();
    defaults = { name: p?.full_name ?? '', phone: p?.phone ?? '' };
  }

  const steps = [
    { icon: Camera, text: c.step1 },
    { icon: MessageSquareText, text: c.step2 },
    { icon: BadgeCheck, text: c.step3 },
  ];

  return (
    <div className="container-x max-w-4xl py-6 sm:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{c.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{c.subtitle}</p>

      <ol className="my-8 grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, text }, i) => (
          <li key={i} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon className="size-5" />
            </span>
            <span className="text-sm">
              <b className="mr-1">{i + 1}.</b>
              {text}
            </span>
          </li>
        ))}
      </ol>

      {auth.user ? (
        <CustomOrderForm defaults={defaults} />
      ) : (
        <div className="card p-8 text-center">
          <p className="text-muted">{c.loginHint}</p>
          <Link href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/custom-order`)}`} className="btn-primary mt-5">
            {c.login}
          </Link>
        </div>
      )}
    </div>
  );
}
