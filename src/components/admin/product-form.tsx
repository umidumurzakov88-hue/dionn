'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { deleteProduct, saveProduct, type ProductInput } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import { ImagesInput } from './image-upload';
import type { Category, Product, Spec } from '@/lib/types';
import { slugify } from '@/lib/format';

type Lang = 'ru' | 'uz' | 'en';
const LANGS: { key: Lang; label: string }[] = [
  { key: 'ru', label: 'Русский' },
  { key: 'uz', label: "O'zbekcha" },
  { key: 'en', label: 'English' },
];
const GROUPS = [
  { key: 'color', label: 'Цвет' },
  { key: 'size', label: 'Размер' },
  { key: 'material', label: 'Материал' },
  { key: 'option', label: 'Другое' },
];

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
      toast.ok('Товар сохранён');
      if (!f.id && r.id) router.replace(`/admin/products/${r.id}`);
      else router.refresh();
    });
  };

  const missingLangs = LANGS.filter((l) => l.key !== 'ru' && !f[`name_${l.key}` as const].trim());

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Names & descriptions */}
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Название и описание</h2>
            <div className="inline-flex rounded-full bg-surface-2 p-0.5 text-xs font-semibold">
              {LANGS.map((l) => (
                <button
                  type="button"
                  key={l.key}
                  onClick={() => setLang(l.key)}
                  className={`rounded-full px-3 py-1.5 ${lang === l.key ? 'bg-surface shadow-sm' : 'text-muted'}`}
                >
                  {l.label}
                  {l.key !== 'ru' && !f[`name_${l.key}` as const].trim() && <span className="ml-1 text-danger">•</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Название ({lang.toUpperCase()}){lang === 'ru' && ' *'}</label>
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
              <label className="label">Описание ({lang.toUpperCase()})</label>
              <textarea value={f[`description_${lang}`]} onChange={(e) => set(`description_${lang}`, e.target.value)} rows={6} className="input" />
            </div>
            {missingLangs.length > 0 && (
              <p className="text-xs text-muted">
                Не заполнено: {missingLangs.map((l) => l.label).join(', ')} — на этих языках будет показан русский текст.
              </p>
            )}
          </div>
        </section>

        {/* Images */}
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Фотографии</h2>
          <p className="mb-4 text-sm text-muted">Первое фото — главное. Фото автоматически сжимаются.</p>
          <ImagesInput value={f.images} onChange={(v) => set('images', v)} />
        </section>

        {/* Variants */}
        <section className="card p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-bold">Варианты (цвет, размер…)</h2>
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
              <Plus className="size-4" /> Добавить
            </button>
          </div>
          <p className="mb-4 text-sm text-muted">Покупатель выбирает вариант на странице товара. Пустая цена = цена товара.</p>
          <div className="space-y-3">
            {f.variants.map((v, i) => {
              const upd = (patch: Partial<typeof v>) => set('variants', f.variants.map((x, k) => (k === i ? { ...x, ...patch } : x)));
              return (
                <div key={v.id ?? i} className="rounded-xl border border-border p-4">
                  <div className="grid gap-3 sm:grid-cols-[140px_1fr_1fr_1fr]">
                    <select value={v.group_name} onChange={(e) => upd({ group_name: e.target.value })} className="input py-2.5">
                      {GROUPS.map((g) => (
                        <option key={g.key} value={g.key}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                    <input value={v.name_ru} onChange={(e) => upd({ name_ru: e.target.value })} placeholder="Название RU *" className="input py-2.5" />
                    <input value={v.name_uz} onChange={(e) => upd({ name_uz: e.target.value })} placeholder="Nomi UZ" className="input py-2.5" />
                    <input value={v.name_en} onChange={(e) => upd({ name_en: e.target.value })} placeholder="Name EN" className="input py-2.5" />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:items-center">
                    {v.group_name === 'color' ? (
                      <input type="color" value={v.color_hex ?? '#000000'} onChange={(e) => upd({ color_hex: e.target.value })} className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-surface p-1" />
                    ) : (
                      <span className="hidden sm:block sm:w-14" />
                    )}
                    <input inputMode="numeric" value={v.price ?? ''} onChange={(e) => upd({ price: num(e.target.value) })} placeholder="Цена, сум" className="input py-2.5" />
                    <input inputMode="numeric" value={v.old_price ?? ''} onChange={(e) => upd({ old_price: num(e.target.value) })} placeholder="Старая цена" className="input py-2.5" />
                    <input value={v.sku ?? ''} onChange={(e) => upd({ sku: e.target.value })} placeholder="Артикул" className="input py-2.5" />
                    <button type="button" onClick={() => set('variants', f.variants.filter((_, k) => k !== i))} className="btn-ghost text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs text-muted">Фото варианта (необязательно)</p>
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
            <h2 className="font-bold">Характеристики</h2>
            <button type="button" onClick={() => set('specs', [...f.specs, { ru: '', uz: '', en: '', value: '' }])} className="btn-outline px-3 py-2">
              <Plus className="size-4" /> Добавить
            </button>
          </div>
          <div className="space-y-2">
            {f.specs.map((s, i) => {
              const upd = (patch: Partial<Spec>) => set('specs', f.specs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
              return (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
                  <input value={s.ru} onChange={(e) => upd({ ru: e.target.value })} placeholder="Параметр RU (Материал)" className="input py-2.5" />
                  <input value={s.uz} onChange={(e) => upd({ uz: e.target.value })} placeholder="UZ" className="input py-2.5" />
                  <input value={s.en} onChange={(e) => upd({ en: e.target.value })} placeholder="EN" className="input py-2.5" />
                  <input value={s.value} onChange={(e) => upd({ value: e.target.value })} placeholder="Значение (Дуб)" className="input py-2.5" />
                  <button type="button" onClick={() => set('specs', f.specs.filter((_, k) => k !== i))} className="btn-ghost text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
            {!f.specs.length && <p className="text-sm text-muted">Например: Материал — Массив дуба; Размеры — 220×95×85 см.</p>}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card space-y-4 p-5 xl:sticky xl:top-24">
          <div>
            <label className="label">Цена, сум *</label>
            <input inputMode="numeric" value={f.price || ''} onChange={(e) => set('price', num(e.target.value) ?? 0)} required className="input text-lg font-bold" />
          </div>
          <div>
            <label className="label">Старая цена (для скидки)</label>
            <input inputMode="numeric" value={f.old_price ?? ''} onChange={(e) => set('old_price', num(e.target.value))} className="input" />
          </div>
          <div>
            <label className="label">Категория</label>
            <select value={f.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)} className="input">
              <option value="">— Без категории —</option>
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
            <label className="label">Наличие</label>
            <select value={f.stock_status} onChange={(e) => set('stock_status', e.target.value as ProductInput['stock_status'])} className="input">
              <option value="in_stock">В наличии</option>
              <option value="preorder">Предзаказ</option>
              <option value="out_of_stock">Нет в наличии</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Артикул</label>
              <input value={f.sku} onChange={(e) => set('sku', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Порядок</label>
              <input type="number" value={f.sort} onChange={(e) => set('sort', Number(e.target.value))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Адрес страницы (slug)</label>
            <input value={f.slug} onChange={(e) => set('slug', e.target.value)} className="input font-mono text-xs" />
          </div>
          <div className="space-y-2.5 border-t border-border pt-4 text-sm">
            {(
              [
                ['is_active', 'Показывать на сайте'],
                ['is_new', 'Метка «Новинка»'],
                ['is_hit', 'Метка «Хит продаж»'],
                ['installment', 'Доступна рассрочка'],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} className="size-4 accent-[var(--accent)]" />
                {label}
              </label>
            ))}
          </div>
          <button disabled={pending} className="btn-primary h-12 w-full">
            {pending ? 'Сохраняем…' : 'Сохранить товар'}
          </button>
          {product && (
            <div className="flex gap-2">
              <a href={`/ru/product/${product.slug}`} target="_blank" className="btn-outline flex-1 text-xs">
                Открыть на сайте
              </a>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm('Удалить товар? Это действие нельзя отменить. Можно вместо этого скрыть товар.')) return;
                  start(async () => {
                    const r = await deleteProduct(product.id);
                    if (r.ok) {
                      toast.ok('Товар удалён');
                      router.push('/admin/products');
                    } else toast.error(r.error);
                  });
                }}
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
