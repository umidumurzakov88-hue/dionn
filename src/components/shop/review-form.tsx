'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';

export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const { t, locale } = useI18n();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  if (userId === undefined) return null;
  if (!userId)
    return (
      <Link href={`/${locale}/login?next=/${locale}/product/${slug}`} className="btn-outline">
        {t.product.loginToReview}
      </Link>
    );
  if (sent) return <p className="rounded-xl bg-surface-2 p-4 text-sm">{t.product.reviewSent}</p>;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await createClient()
      .from('reviews')
      .insert({ product_id: productId, user_id: userId, name: String(fd.get('name')), text: String(fd.get('text')), rating });
    setLoading(false);
    if (error) toast.error(t.common.error);
    else setSent(true);
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h3 className="font-bold">{t.product.writeReview}</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n}`}>
            <Star className={`size-6 text-accent ${n <= rating ? 'fill-current' : 'opacity-30'}`} />
          </button>
        ))}
      </div>
      <input name="name" required maxLength={60} placeholder={t.product.yourName} className="input" />
      <textarea name="text" required maxLength={1500} rows={3} placeholder={t.product.reviewText} className="input" />
      <button disabled={loading} className="btn-primary">
        {t.common.send}
      </button>
    </form>
  );
}
