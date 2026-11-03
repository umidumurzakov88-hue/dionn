import Link from 'next/link';
import { Star } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { Empty, PageHeader } from '@/components/admin/ui';
import { ReviewActions } from '@/components/admin/row-actions';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Отзывы' };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { supabase } = await requireStaff();
  const { tab } = await searchParams;
  const pending = tab !== 'published';
  const { data } = await supabase
    .from('reviews')
    .select('*, products(name_ru, slug)')
    .eq('is_approved', !pending)
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as {
    id: string;
    name: string;
    rating: number;
    text: string;
    created_at: string;
    is_approved: boolean;
    products: { name_ru: string; slug: string } | null;
  }[];

  return (
    <>
      <PageHeader title="Отзывы" subtitle="Отзывы появляются на сайте только после публикации" />
      <div className="mb-4 flex gap-2">
        <Link href="/admin/reviews" className={`chip px-4 py-2 ${pending ? 'bg-primary text-primary-fg' : 'bg-surface-2'}`}>
          На модерации
        </Link>
        <Link href="/admin/reviews?tab=published" className={`chip px-4 py-2 ${!pending ? 'bg-primary text-primary-fg' : 'bg-surface-2'}`}>
          Опубликованные
        </Link>
      </div>
      {!rows.length ? (
        <Empty text={pending ? 'Новых отзывов нет' : 'Опубликованных отзывов пока нет'} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted">{formatDate(r.created_at)}</p>
                </div>
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className={`size-4 ${k < r.rating ? 'fill-current' : 'opacity-30'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm">{r.text}</p>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                {r.products ? (
                  <a href={`/ru/product/${r.products.slug}`} target="_blank" className="truncate text-xs text-muted hover:text-fg">
                    {r.products.name_ru}
                  </a>
                ) : (
                  <span className="text-xs text-muted">Общий отзыв</span>
                )}
                <ReviewActions id={r.id} approved={r.is_approved} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
