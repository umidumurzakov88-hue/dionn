import { requireStaff } from '@/lib/admin-auth';
import { CrudTable } from '@/components/admin/crud';
import type { Category } from '@/lib/types';

export const metadata = { title: 'Категории' };

export default async function CategoriesPage() {
  const { supabase } = await requireStaff();
  const [{ data }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('sort'),
    supabase.from('products').select('category_id'),
  ]);
  const cats = (data as Category[]) ?? [];
  // Parents first, children right after their parent
  const ordered = cats.filter((c) => !c.parent_id).flatMap((p) => [p, ...cats.filter((c) => c.parent_id === p.id)]);
  const orphans = cats.filter((c) => c.parent_id && !cats.some((p) => p.id === c.parent_id));
  const rows = [...ordered, ...orphans];
  const counts = new Map<string, number>();
  (products ?? []).forEach((p) => p.category_id && counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1));

  const display = Object.fromEntries(
    rows.map((c) => [
      c.id,
      {
        name_ru: c.parent_id ? `↳ ${c.name_ru}` : c.name_ru,
        products: String(counts.get(c.id) ?? 0),
      },
    ]),
  );

  return (
    <CrudTable
      table="categories"
      title="Категории"
      addLabel="Новая категория"
      rows={rows as unknown as Record<string, unknown>[]}
      display={display}
      defaults={{ name_ru: '', name_uz: '', name_en: '', slug: '', parent_id: null, image: null, sort: 0, is_active: true }}
      columns={[
        { key: 'image', label: 'Фото', kind: 'image' },
        { key: 'name_ru', label: 'Название' },
        { key: 'slug', label: 'Адрес', className: 'font-mono text-xs text-muted' },
        { key: 'products', label: 'Товаров' },
        { key: 'sort', label: 'Порядок' },
        { key: 'is_active', label: 'Активна', kind: 'bool' },
      ]}
      fields={[
        { name: 'name_ru', label: 'Название (RU)', type: 'text', required: true },
        { name: 'name_uz', label: 'Nomi (UZ)', type: 'text', half: true },
        { name: 'name_en', label: 'Name (EN)', type: 'text', half: true },
        {
          name: 'parent_id',
          label: 'Родительская категория',
          type: 'select',
          half: true,
          options: [
            { value: '', label: '— Нет (главная категория) —' },
            ...cats.filter((c) => !c.parent_id).map((c) => ({ value: c.id, label: c.name_ru })),
          ],
        },
        { name: 'slug', label: 'Адрес (латиницей, необязательно)', type: 'text', half: true, placeholder: 'divany' },
        { name: 'sort', label: 'Порядок', type: 'number', half: true },
        { name: 'is_active', label: 'Показывать на сайте', type: 'checkbox', half: true },
        { name: 'image', label: 'Фото категории', type: 'image', folder: 'categories' },
      ]}
    />
  );
}
