'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { deleteProduct, saveProduct, type ProductInput } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import { ImagesInput } from './image-upload';
import type { Category, Product, Spec } from '@/lib/types';
import { slugify } from '@/lib/format';
import { useAdminT } from '@/i18n/admin/provider';
import { fmt } from '@/i18n/admin';

type Lang = 'ru' | 'uz' | 'en';
const LANGS: Lang[] = ['ru', 'uz', 'en'];
const GROUPS = ['color', 'size', 'material', 'option'] as const;

function emptyInput(): ProductInput {
  return {
    slug: '',
    sku: '',
    category_id: null,
    name_ru: '',
    name_uz: '',
    name_en: '',
    description_ru: '',
    description_uz: '',
    description_en: '',
    price: 0,
    old_price: null,
    images: [],
    specs: [],
    stock_status: 'in_stock',
    is_new: true,
    is_hit: false,
    is_active: true,
    installment: true,
    sort: 0,
    variants: [],
  };
}

function fromProduct(p: Product): ProductInput {
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku ?? '',
    category_id: p.category_id,
    name_ru: p.name_ru,
    name_uz: p.name_uz,
    name_en: p.name_en,
    description_ru: p.description_ru,
    description_uz: p.description_uz,
    description_en: p.description_en,
    price: Number(p.price),
    old_price: p.old_price != null ? Number(p.old_price) : null,
    images: p.images ?? [],
    specs: (p.specs ?? []) as Spec[],
    stock_status: p.stock_status,
    is_new: p.is_new,
    is_hit: p.is_hit,
    is_active: p.is_active,
    installment: p.installment,
    sort: p.sort,
    variants: (p.product_variants ?? [])
      .sort((a, b) => a.sort - b.sort)
      .map((v) => ({
        id: v.id,
        group_name: v.group_name,
        name_ru: v.name_ru,
        name_uz: v.name_uz,
        name_en: v.name_en,
        color_hex: v.color_hex,
        price: v.price != null ? Number(v.price) : null,
        old_price: v.old_price != null ? Number(v.old_price) : null,
        image: v.image,
        sku: v.sku,
        stock: v.stock,
      })),
  };
}

const num = (v: string) => (v === '' ? null : Number(v.replace(/\s/g, '')));

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const { t } = useAdminT();
  const tf = t.products.form;
  const [f, setF] = useState<ProductInput>(product ? fromProduct(product) : emptyInput());
  const [lang, setLang] = useState<Lang>('ru');
  const [pending, start] = useTransition();
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setF((s) => ({ ...s, [k]: v }));

  const roots = categories.filter((c) => !c.parent_id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveProduct(f);
      if (!r.ok) return toast.error(r.error);
      toast.ok(tf.saved);
      if (!f.id && r.id) router.replace(`/admin/products/${r.id}`);
      else router.refresh();
    });
  };

  const missingLangs = LANGS.filter((l) => l !== 'ru' && !f[`name_${l}` as const].trim());

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Names & descriptions */}
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">{tf.nameDesc}</h2>
            <div className="inline-flex rounded-full bg-surface-2 p-0.5 text-xs font-semibold">
              {LANGS.map((l) => (
                <button
                  type="button"
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-full px-3 py-1.5 ${lang === l ? 'bg-surface shadow-sm' : 'text-muted'}`}
                >
                  {tf.langs[l]}
                  {l !== 'ru' && !f[`name_${l}` as const].trim() && <span className="ml-1 text-danger">•</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">{tf.name} ({lang.toUpperCase()}){lang === 'ru' && ' *'}</label>
              <input
                value={f[`name_${lang}`]}
                onChange={(e) => {
                  set(`name_${lang}`, e.target.value);
                  if (lang === 'ru' && !product) set('slug', slugify(e.target.value));
                }}
                required={lang === 'ru'}
                className="input"
              />
            </div>
            <div>
              <label className="label">{tf.description} ({lang.toUpperCase()})</label>
              <textarea value={f[`description_${lang}`]} onChange={(e) => set(`description_${lang}`, e.target.value)} rows={6} className="input" />
            </div>
            {missingLangs.length > 0 && (
              <p className="text-xs text-muted">
                {fmt(tf.missing, { langs: missingLangs.map((l) => tf.langs[l]).join(', ') })}
              </p>
            )}
          </div>
        </section>

        {/* Images */}
        <section className="card p-5">
          <h2 className="mb-1 font-bold">{tf.photos}</h2>
          <p className="mb-4 text-sm text-muted">{tf.photosHint}</p>
          <ImagesInput value={f.images} onChange={(v) => set('images', v)} />
        </section>

        {/* Variants */}
        <section className="card p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-bold">{tf.variants}</h2>
            <button
              type="button"
              onClick={() =>
                set('variants', [
                  ...f.variants,
                  { group_name: 'color', name_ru: '', name_uz: '', name_en: '', color_hex: '#8b7355', price: null, old_price: null, image: null, sku: null, stock: 0 },
                ])
              }
              className="btn-outline px-3 py-2"
            >
              <Plus className="size-4" /> {t.common.add}
            </button>
          </div>
          <p className="mb-4 text-sm text-muted">{tf.variantsHint}</p>
          <div className="space-y-3">
            {f.variants.map((v, i) => {
              const upd = (patch: Partial<typeof v>) => set('variants', f.variants.map((x, k) => (k === i ? { ...x, ...patch } : x)));
              return (
                <div key={v.id ?? i} className="rounded-xl border border-border p-4">
                  <div className="grid gap-3 sm:grid-cols-[140px_1fr_1fr_1fr]">
                    <select value={v.group_name} onChange={(e) => upd({ group_name: e.target.value })} className="input py-2.5">
                      {GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {tf.groups[g]}
                        </option>
                      ))}
                    </select>
                    <input value={v.name_ru} onChange={(e) => upd({ name_ru: e.target.value })} placeholder={tf.variantNameRu} className="input py-2.5" />
                    <input value={v.name_uz} onChange={(e) => upd({ name_uz: e.target.value })} placeholder={tf.variantNameUz} className="input py-2.5" />
                    <input value={v.name_en} onChange={(e) => upd({ name_en: e.target.value })} placeholder={tf.variantNameEn} className="input py-2.5" />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:items-center">
                    {v.group_name === 'color' ? (
                      <input type="color" value={v.color_hex ?? '#000000'} onChange={(e) => upd({ color_hex: e.target.value })} className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-surface p-1" />
                    ) : (
                      <span className="hidden sm:block sm:w-14" />
                    )}
                    <input inputMode="numeric" value={v.price ?? ''} onChange={(e) => upd({ price: num(e.target.value) })} placeholder={tf.variantPrice} className="input py-2.5" />
                    <input inputMode="numeric" value={v.old_price ?? ''} onChange={(e) => upd({ old_price: num(e.target.value) })} placeholder={tf.variantOldPrice} className="input py-2.5" />
                    <input value={v.sku ?? ''} onChange={(e) => upd({ sku: e.target.value })} placeholder={tf.sku} className="input py-2.5" />
                    <button type="button" onClick={() => set('variants', f.variants.filter((_, k) => k !== i))} aria-label={tf.removeVariant} title={tf.removeVariant} className="btn-ghost text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs text-muted">{tf.variantPhoto}</p>
                    <div className="w-28">
                      <ImagesInput value={v.image ? [v.image] : []} onChange={(arr) => upd({ image: arr[0] ?? null })} multiple={false} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Specs */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">{tf.specs}</h2>
            <button type="button" onClick={() => set('specs', [...f.specs, { ru: '', uz: '', en: '', value: '' }])} className="btn-outline px-3 py-2">
              <Plus className="size-4" /> {t.common.add}
            </button>
          </div>
          <div className="space-y-2">
            {f.specs.map((s, i) => {
              const upd = (patch: Partial<Spec>) => set('specs', f.specs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
              return (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
                  <input value={s.ru} onChange={(e) => upd({ ru: e.target.value })} placeholder={tf.specParam} className="input py-2.5" />
                  <input value={s.uz} onChange={(e) => upd({ uz: e.target.value })} placeholder="UZ" className="input py-2.5" />
                  <input value={s.en} onChange={(e) => upd({ en: e.target.value })} placeholder="EN" className="input py-2.5" />
                  <input value={s.value} onChange={(e) => upd({ value: e.target.value })} placeholder={tf.specValue} className="input py-2.5" />
                  <button type="button" onClick={() => set('specs', f.specs.filter((_, k) => k !== i))} aria-label={tf.removeSpec} title={tf.removeSpec} className="btn-ghost text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
            {!f.specs.length && <p className="text-sm text-muted">{tf.specsHint}</p>}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card space-y-4 p-5 xl:sticky xl:top-24">
          <div>
            <label className="label">{tf.price}</label>
            <input inputMode="numeric" value={f.price || ''} onChange={(e) => set('price', num(e.target.value) ?? 0)} required className="input text-lg font-bold" />
          </div>
          <div>
            <label className="label">{tf.oldPrice}</label>
            <input inputMode="numeric" value={f.old_price ?? ''} onChange={(e) => set('old_price', num(e.target.value))} className="input" />
          </div>
          <div>
            <label className="label">{tf.category}</label>
            <select value={f.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)} className="input">
              <option value="">{tf.noCategory}</option>
              {roots.map((r) => (
                <optgroup key={r.id} label={r.name_ru}>
                  <option value={r.id}>{r.name_ru}</option>
                  {categories
                    .filter((c) => c.parent_id === r.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        — {c.name_ru}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{tf.stock}</label>
            <select value={f.stock_status} onChange={(e) => set('stock_status', e.target.value as ProductInput['stock_status'])} className="input">
              <option value="in_stock">{tf.stockOpt.in_stock}</option>
              <option value="preorder">{tf.stockOpt.preorder}</option>
              <option value="out_of_stock">{tf.stockOpt.out_of_stock}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{tf.sku}</label>
              <input value={f.sku} onChange={(e) => set('sku', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{tf.sort}</label>
              <input type="number" value={f.sort} onChange={(e) => set('sort', Number(e.target.value))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">{tf.slug}</label>
            <input value={f.slug} onChange={(e) => set('slug', e.target.value)} className="input font-mono text-xs" />
          </div>
          <div className="space-y-2.5 border-t border-border pt-4 text-sm">
            {(['is_active', 'is_new', 'is_hit', 'installment'] as const).map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} className="size-4 accent-[var(--accent)]" />
                {tf.flags[k]}
              </label>
            ))}
          </div>
          <button disabled={pending} className="btn-primary h-12 w-full">
            {pending ? tf.saving : tf.saveProduct}
          </button>
          {product && (
            <div className="flex gap-2">
              <a href={`/ru/product/${product.slug}`} target="_blank" className="btn-outline flex-1 text-xs">
                {tf.openOnSite}
              </a>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(tf.confirmDelete)) return;
                  start(async () => {
                    const r = await deleteProduct(product.id);
                    if (r.ok) {
                      toast.ok(tf.deleted);
                      router.push('/admin/products');
                    } else toast.error(r.error);
                  });
                }}
                aria-label={tf.deleteProduct}
                title={tf.deleteProduct}
                className="btn-ghost text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </section>
      </aside>
    </form>
  );
}
