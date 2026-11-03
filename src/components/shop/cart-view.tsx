'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { useHydrated, useShop } from '@/store/shop';
import { Price } from './price';
import { toast } from '@/components/ui/toast';

export function usePromoDiscount(subtotal: number) {
  const promo = useShop((s) => s.promo);
  const key = promo ? `${promo}:${subtotal}` : '';
  const [result, setResult] = useState({ key: '', discount: 0 });
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/promo?code=${encodeURIComponent(promo!)}&total=${subtotal}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setResult({ key, discount: d.valid ? d.discount : 0 }));
    return () => {
      cancelled = true;
    };
  }, [key, promo, subtotal]);
  return key && result.key === key ? result.discount : 0;
}

export function CartView() {
  const { t, locale } = useI18n();
  const hydrated = useHydrated();
  const cart = useShop((s) => s.cart);
  const promo = useShop((s) => s.promo);
  const { setQty, removeFromCart, clearCart, setPromo } = useShop.getState();
  const [code, setCode] = useState('');

  const subtotal = cart.reduce((a, l) => a + l.price * l.qty, 0);
  const discount = usePromoDiscount(subtotal);
  const count = cart.reduce((a, l) => a + l.qty, 0);

  if (!hydrated) return <div className="h-64" />;

  if (!cart.length)
    return (
      <div className="card grid place-items-center px-6 py-20 text-center">
        <ShoppingBag className="size-14 text-muted" strokeWidth={1.2} />
        <p className="mt-4 text-xl font-bold">{t.cart.empty}</p>
        <p className="mt-1 text-muted">{t.cart.emptyHint}</p>
        <Link href={`/${locale}/catalog`} className="btn-primary mt-6">
          {t.cart.goCatalog}
        </Link>
      </div>
    );

  const applyPromo = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const r = await fetch(`/api/promo?code=${encodeURIComponent(c)}&total=${subtotal}`).then((r) => r.json());
    if (r.valid) {
      setPromo(c);
      toast.ok(t.cart.promoApplied);
    } else toast.error(t.cart.promoInvalid);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {cart.map((l) => (
          <div key={l.key} className="card flex gap-4 p-3 sm:p-4">
            <Link href={`/${locale}/product/${l.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:size-28">
              {l.image && <Image src={l.image} alt="" fill sizes="112px" className="object-cover" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/${locale}/product/${l.slug}`} className="line-clamp-2 font-semibold hover:text-accent">
                    {l.name[locale] || l.name.ru}
                  </Link>
                  {l.variantName && <p className="mt-0.5 text-sm text-muted">{l.variantName[locale] || l.variantName.ru}</p>}
                </div>
                <button onClick={() => removeFromCart(l.key)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-danger" aria-label={t.cart.remove}>
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                <div className="flex h-10 items-center rounded-xl border border-border">
                  <button onClick={() => setQty(l.key, l.qty - 1)} className="grid h-full w-9 place-items-center" aria-label="-">
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold">{l.qty}</span>
                  <button onClick={() => setQty(l.key, l.qty + 1)} className="grid h-full w-9 place-items-center" aria-label="+">
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <Price value={l.price * l.qty} className="text-lg font-bold" />
              </div>
            </div>
          </div>
        ))}
        <button onClick={clearCart} className="btn-ghost text-sm text-muted">
          <Trash2 className="size-4" /> {t.cart.clear}
        </button>
      </div>

      <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-32">
        <div className="flex gap-2">
          <input
            value={promo ?? code}
            disabled={!!promo}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.cart.promo}
            className="input py-2.5 uppercase"
          />
          {promo ? (
            <button onClick={() => setPromo(null)} className="btn-outline px-4 py-2.5">
              ✕
            </button>
          ) : (
            <button onClick={applyPromo} className="btn-outline px-4 py-2.5">
              {t.cart.promoApply}
            </button>
          )}
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">
              {t.cart.subtotal} ({count})
            </dt>
            <dd>
              <Price value={subtotal} />
            </dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>{t.cart.discount}</dt>
              <dd>
                −<Price value={discount} />
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">{t.cart.delivery}</dt>
            <dd className="font-medium text-success">{t.cart.free}</dd>
          </div>
        </dl>
        <div className="flex items-end justify-between border-t border-border pt-4">
          <span className="font-semibold">{t.cart.total}</span>
          <Price value={Math.max(0, subtotal - discount)} className="text-2xl font-extrabold" />
        </div>
        <Link href={`/${locale}/checkout`} className="btn-primary h-12 w-full">
          {t.cart.checkout}
        </Link>
      </aside>
    </div>
  );
}
