'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useI18n } from '@/i18n/provider';
import { toast } from '@/components/ui/toast';

/** Callback request / quick order form. With productId it acts as a "quick order". */
export function CallbackModal({
  open,
  onClose,
  productId,
  productName,
}: {
  open: boolean;
  onClose: () => void;
  productId?: string;
  productName?: string;
}) {
  const { t, locale, loggedIn } = useI18n();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch('/api/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        phone: fd.get('phone'),
        comment: fd.get('comment'),
        productId,
        website: fd.get('website'), // honeypot
      }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else toast.error(res.status === 400 ? t.checkout.invalidPhone : t.common.error);
  }

  const close = () => {
    onClose();
    setTimeout(() => setDone(false), 300);
  };

  return (
    <Modal open={open} onClose={close} title={productId ? t.quick.title : t.callback.title}>
      {productId && !loggedIn ? (
        <div className="space-y-4 py-2 text-center">
          <p className="text-sm text-muted">{t.auth.checkoutHint}</p>
          <Link href={`/${locale}/login?next=${encodeURIComponent(pathname)}`} className="btn-primary w-full">
            {t.auth.loginToOrder}
          </Link>
        </div>
      ) : done ? (
        <p className="py-6 text-center text-lg font-medium">{t.callback.sent}</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-muted">{productId ? t.quick.text : t.callback.text}</p>
          {productName && <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm font-medium">{productName}</p>}
          <input name="name" required placeholder={t.callback.name} className="input" />
          <input name="phone" required type="tel" placeholder="+998 __ ___ __ __" className="input" />
          <textarea name="comment" rows={2} placeholder={t.callback.comment} className="input" />
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />
          <button disabled={loading} className="btn-primary w-full">
            {loading ? t.common.loading : productId ? t.product.quickOrder : t.callback.send}
          </button>
        </form>
      )}
    </Modal>
  );
}
