import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { getAdminT } from '@/lib/admin-i18n';
import { fmt, uzsL } from '@/i18n/admin';
import { PageHeader } from '@/components/admin/ui';
import { Pagination, SearchBar } from '@/components/admin/search-bar';
import { ActiveToggle } from '@/components/admin/active-toggle';
import type { Category, Product } from '@/lib/types';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.products.title };
}
const PER_PAGE = 30;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; category?: string }> }) {
  const [{ supabase }, { t, locale }] = await Promise.all([requireStaff(), getAdminT()]);
  const tp = t.products;
  const uzs = (v: number | string | null | undefined) => uzsL(v, locale);
  const STOCK: Record<string, string> = tp.stockShort;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  let q = supabase
    .from('products')
    .select('*, product_variants(id), categories(name_ru)', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (sp.q) {
    const s = sp.q.replace(/[%,()]/g, ' ').trim();
    q = q.or(`name_ru.ilike.%${s}%,name_uz.ilike.%${s}%,name_en.ilike.%${s}%,sku.ilike.%${s}%`);
  }
  if (sp.category) q = q.eq('category_id', sp.category);
  const [{ data, count }, { data: cats }] = await Promise.all([
    q.range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
    supabase.from('categories').select('id, name_ru, parent_id').order('sort'),
  ]);
  const products = (data as Product[]) ?? [];

  return (
    <>
      <PageHeader title={tp.title} subtitle={fmt(tp.total, { n: count ?? 0 })}>
        <Link href="/admin/products/new" className="btn-primary h-10 py-0">
          <Plus className="size-4" /> {tp.addProduct}
        </Link>
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-3">
        <Suspense>
          <SearchBar placeholder={tp.searchPlaceholder} />
        </Suspense>
        <form className="flex gap-2">
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          <select name="category" defaultValue={sp.category ?? ''} className="input h-10 w-auto py-0">
            <option value="">{tp.allCategories}</option>
            {((cats as Category[]) ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.parent_id ? '— ' : ''}
                {c.name_ru}
              </option>
            ))}
          </select>
          <button className="btn-outline h-10 py-0">{tp.apply}</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-surface-2/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">{tp.col.product}</th>
                <th className="px-5 py-3">{tp.col.category}</th>
                <th className="px-5 py-3">{tp.col.stock}</th>
                <th className="px-5 py-3 text-right">{tp.col.price}</th>
                <th className="px-5 py-3 text-center">{tp.col.onSite}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p, i) => (
                <tr key={p.id} className="animate-stagger-item hover:bg-surface-2/60" style={{ '--i': Math.min(i, 12) } as React.CSSProperties}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-semibold hover:text-accent">{p.name_ru}</span>
                        <span className="flex gap-1.5 text-xs text-muted">
                          {p.sku && <span>{p.sku}</span>}
                          {!!p.product_variants?.length && <span>· {p.product_variants.length} {tp.variantsShort}</span>}
                          {p.is_new && <span className="text-accent">· {tp.badgeNew}</span>}
                          {p.is_hit && <span className="text-accent">· {tp.badgeHit}</span>}
                          {(!p.name_uz || !p.name_en) && <span className="text-warning">· {tp.noTranslation}</span>}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{p.categories?.name_ru ?? '—'}</td>
                  <td className="px-5 py-3">{STOCK[p.stock_status]}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <span className="font-semibold">{uzs(p.price)}</span>
                    {p.old_price && <span className="block text-xs text-muted line-through">{uzs(p.old_price)}</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <ActiveToggle id={p.id} active={p.is_active} />
                  </td>
                </tr>
              ))}
              {!products.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted">
                    {tp.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Suspense>
          <Pagination page={page} pages={Math.ceil((count ?? 0) / PER_PAGE)} />
        </Suspense>
      </div>
    </>
  );
}
