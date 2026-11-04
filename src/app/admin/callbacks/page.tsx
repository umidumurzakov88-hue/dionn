import Link from 'next/link';
import { requireStaff } from '@/lib/admin-auth';
import { Empty, PageHeader } from '@/components/admin/ui';
import { CallbackActions } from '@/components/admin/row-actions';
import { formatDate } from '@/lib/format';
import { getAdminT } from '@/lib/admin-i18n';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.feedback.callbacks.title };
}

export default async function CallbacksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ supabase }, { t, locale }] = await Promise.all([requireStaff(), getAdminT()]);
  const c = t.feedback.callbacks;
  const { tab } = await searchParams;
  const done = tab === 'done';
  const { data } = await supabase
    .from('callback_requests')
    .select('*, products(name_ru, slug)')
    .eq('handled', done)
    .order('created_at', { ascending: false })
    .limit(300);
  const rows = (data ?? []) as {
    id: string;
    name: string;
    phone: string;
    comment: string | null;
    handled: boolean;
    created_at: string;
    products: { name_ru: string; slug: string } | null;
  }[];

  return (
    <>
      <PageHeader title={c.title} subtitle={c.subtitle} />
      <div className="mb-4 flex gap-2">
        <Link href="/admin/callbacks" className={`chip px-4 py-2 ${!done ? 'bg-primary text-primary-fg' : 'bg-surface-2'}`}>
          {c.tabNew}
        </Link>
        <Link href="/admin/callbacks?tab=done" className={`chip px-4 py-2 ${done ? 'bg-primary text-primary-fg' : 'bg-surface-2'}`}>
          {c.tabDone}
        </Link>
      </div>
      {!rows.length ? (
        <Empty text={done ? c.emptyDone : c.emptyNew} />
      ) : (
        <div className="card divide-y divide-border">
          {rows.map((r, i) => (
            <div key={r.id} className="animate-stagger-item flex flex-wrap items-center gap-4 p-5" style={{ '--i': i } as React.CSSProperties}>
              <div className="min-w-[200px] flex-1">
                <div className="flex items-center gap-2">
                  <span className={`chip ${r.products ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>
                    {r.products ? c.quickOrder : c.call}
                  </span>
                  <span className="text-xs text-muted">{formatDate(r.created_at, locale)}</span>
                </div>
                <p className="mt-1.5 font-semibold">
                  {r.name} ·{' '}
                  <a href={`tel:${r.phone}`} className="text-accent hover:underline">
                    {r.phone}
                  </a>
                </p>
                {r.products && (
                  <a href={`/ru/product/${r.products.slug}`} target="_blank" className="text-sm text-muted hover:text-fg">
                    {r.products.name_ru}
                  </a>
                )}
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
              </div>
              <CallbackActions id={r.id} handled={r.handled} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
