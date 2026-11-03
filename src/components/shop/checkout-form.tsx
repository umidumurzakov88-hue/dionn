'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { useHydrated, useShop } from '@/store/shop';
import { Price } from './price';
import { usePromoDiscount } from './cart-view';
import { toast } from '@/components/ui/toast';
import type { PaymentMethod } from '@/lib/types';

export interface CheckoutDefaults {
  name: string;
  phone: string;
  email: string;
}

function Radio({ checked, onChange, title, hint }: { checked: boolean; onChange: () => void; title: string; hint?: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${checked ? 'border-fg' : 'border-border hover:border-muted'}`}>
      <input type="radio" checked={checked} onChange={onChange} className="mt-0.5 size-4 accent-[var(--fg)]" />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function CheckoutForm({ defaults, payments }: { defaults: CheckoutDefaults; payments: PaymentMethod[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const cart = useShop((s) => s.cart);
  const promo = useShop((s) => s.promo);
  const clearCart = useShop((s) => s.clearCart);
  const [delivery, setDelivery] = useState<'delivery' | 'pickup'>('delivery');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce((a, l) => a + l.price * l.qty, 0);
  const discount = usePromoDiscount(subtotal);

  useEffect(() => {
    if (hydrated && !cart.length && !loading) router.replace(`/${locale}/cart`);
  }, [hydrated, cart.length, loading, locale, router]);

  if (!hydrated || !cart.length) return <div className="h-64" />;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        city: fd.get('city'),
        address: fd.get('address'),
        comment: fd.get('comment'),
        delivery,
        payment,
        promo,
        locale,
        items: cart.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      router.push(`/${locale}/login?next=/${locale}/checkout`);
      return;
    }
    if (!res.ok) {
      setLoading(false);
      toast.error(data.error === 'phone' ? t.checkout.invalidPhone : data.error === 'required' ? t.checkout.required : t.common.error);
      return;
    }
    clearCart();
    router.push(data.redirect ?? `/${locale}/order/${data.id}?t=${data.token}`);
  }

  const payLabel: Record<PaymentMethod, string> = {
    cash: t.checkout.pay_cash,
    card: t.checkout.pay_card,
    click: t.checkout.pay_click,
    payme: t.checkout.pay_payme,
    uzum: t.checkout.pay_uzum,
    installment: t.checkout.pay_installment,
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">{t.checkout.contact}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t.checkout.name} *</label>
              <input name="name" required defaultValue={defaults.name} className="input" autoComplete="name" />
            </div>
            <div>
              <label className="label">{t.checkout.phone} *</label>
              <input name="phone" required type="tel" defaultValue={defaults.phone} placeholder="+998 __ ___ __ __" className="input" autoComplete="tel" />
            </div>
          </div>
          <div>
            <label className="label">{t.checkout.email}</label>
            <input name="email" type="email" defaultValue={defaults.email} className="input" autoComplete="email" />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">{t.checkout.deliveryTitle}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Radio checked={delivery === 'delivery'} onChange={() => setDelivery('delivery')} title={t.checkout.delivery} hint={t.checkout.deliveryHint} />
            <Radio checked={delivery === 'pickup'} onChange={() => setDelivery('pickup')} title={t.checkout.pickup} hint={t.checkout.pickupHint} />
          </div>
          {delivery === 'delivery' && (
            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <div>
                <label className="label">{t.checkout.city} *</label>
                <select name="city" required className="input">
                  {t.checkout.regions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t.checkout.address} *</label>
                <input name="address" required className="input" autoComplete="street-address" />
              </div>
            </div>
          )}
          <div>
            <label className="label">{t.checkout.comment}</label>
            <textarea name="comment" rows={2} className="input" />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">{t.checkout.paymentTitle}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {payments.map((p) => (
              <Radio
                key={p}
                checked={payment === p}
                onChange={() => setPayment(p)}
                title={payLabel[p]}
                hint={p === 'installment' ? t.checkout.installmentHint : undefined}
              />
            ))}
          </div>
        </section>
      </div>

      <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-32">
        <ul className="max-h-72 space-y-3 overflow-y-auto">
          {cart.map((l) => (
            <li key={l.key} className="flex gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-1 font-medium">{l.name[locale] || l.name.ru}</p>
                <p className="text-xs text-muted">
                  {l.variantName ? `${l.variantName[locale] || l.variantName.ru} · ` : ''}
                  {l.qty} {t.common.pcs}
                </p>
              </div>
              <Price value={l.price * l.qty} className="text-sm font-semibold" />
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t.cart.subtotal}</dt>
            <dd>
              <Price value={subtotal} />
            </dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>
                {t.cart.discount} ({promo})
              </dt>
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
        <button disabled={loading} className="btn-primary h-12 w-full">
          {loading ? t.checkout.placing : t.checkout.place}
        </button>
        <p className="text-center text-xs text-muted">{t.checkout.agree}</p>
      </aside>
    </form>
  );
}
