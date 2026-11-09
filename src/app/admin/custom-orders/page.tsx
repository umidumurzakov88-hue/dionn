import Link from 'next/link';
import { requireStaff } from '@/lib/admin-auth';
import { Empty, PageHeader } from '@/components/admin/ui';
import { CustomOrderDelete, CustomOrderQuoteForm } from '@/components/admin/custom-order-controls';
import { formatDate } from '@/lib/format';
import { getAdminT } from '@/lib/admin-i18n';
import { fmt, uzsL } from '@/i18n/admin';
import { CUSTOM_ORDER_STATUSES, type CustomOrder, type CustomOrderStatus } from '@/lib/types';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.feedback.custom.title };
}

export default async function CustomOrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string; open?: string }> }) {
  const [{ supabase }, { t, locale }] = await Promise.all([requireStaff(), getAdminT()]);
  const c = t.feedback.custom;
  const { tab: rawTab, open } = await searchParams;

  // Links from Telegram (?open=<id>) land on the tab the request is currently in.
  let tab: CustomOrderStatus = CUSTOM_ORDER_STATUSES.includes(rawTab as CustomOrderStatus) ? (rawTab as CustomOrderStatus) : 'new';
  if (!rawTab && open) {
    const { data } = await supabase.from('custom_orders').select('status').eq('id', open).maybeSingle();
    if (data) tab = data.status as CustomOrderStatus;
  }

  const [{ data }, counts] = await Promise.all([
    supabase.from('custom_orders').select('*').eq('status', tab).order('created_at', { ascending: false }).limit(200),
    Promise.all(
      CUSTOM_ORDER_STATUSES.map((s) => supabase.from('custom_orders').select('id', { count: 'exact', head: true }).eq('status', s)),
    ),
  ]);
  const rows = (data ?? []) as CustomOrder[];

  return (
    <>
      <PageHeader title={c.title} subtitle={c.subtitle} />
      <div className="mb-4 flex flex-wrap gap-2">
        {CUSTOM_ORDER_STATUSES.map((s, i) => (
          <Link
            key={s}
            href={`/admin/custom-orders?tab=${s}`}
            className={`chip px-4 py-2 ${tab === s ? 'bg-primary text-primary-fg' : 'bg-surface-2'}`}
          >
            {c.tabs[s]}
            {!!counts[i].count && <span className="ml-1.5 opacity-70">{counts[i].count}</span>}
          </Link>
        ))}
      </div>

      {!rows.length ? (
        <Empty text={c.empty} />
      ) : (
        <div className="space-y-4">
          {rows.map((r, i) => (
            <article
              key={r.id}
              id={`co-${r.id}`}
              className={`card animate-stagger-item scroll-mt-24 p-5 ${open === r.id ? 'ring-2 ring-accent' : ''}`}
              style={{ '--i': i } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{fmt(c.number, { n: r.number })}</p>
                  <p className="text-xs text-muted">{formatDate(r.created_at, locale)}</p>
                  <p className="mt-1.5 font-semibold">
                    {r.name} ·{' '}
                    <a href={`tel:${r.phone}`} className="text-accent hover:underline">
                      {r.phone}
                    </a>
                  </p>
                </div>
                <CustomOrderDelete id={r.id} />
              </div>

              {r.images.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {r.images.map((src) => (
                    <a key={src} href={src} target="_blank" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- customer uploads, opened full size on click */}
                      <img src={src} alt="" className="size-32 rounded-xl border border-border object-cover transition hover:opacity-90" />
                    </a>
                  ))}
                </div>
              )}

              <p className="mt-3 whitespace-pre-line text-sm">{r.description}</p>
              {r.dimensions && (
                <p className="mt-1 text-sm">
                  <span className="text-muted">{c.dimensions}:</span> {r.dimensions}
                </p>
              )}

              <div className="mt-4 border-t border-border pt-4">
                {r.status === 'new' || r.status === 'quoted' ? (
                  <CustomOrderQuoteForm id={r.id} price={r.price} leadTime={r.lead_time} comment={r.admin_comment} />
                ) : (
                  <div className="text-sm">
                    <p>
                      <span className="text-muted">{c.price}:</span> <b>{uzsL(r.price, locale)}</b>
                      {r.lead_time && <span className="text-muted"> · {r.lead_time}</span>}
                    </p>
                    {r.admin_comment && <p className="mt-1 whitespace-pre-line text-muted">{r.admin_comment}</p>}
                    {r.answered_at && (
                      <p className="mt-1 text-xs text-muted">
                        {c.answeredAt}: {formatDate(r.answered_at, locale)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
