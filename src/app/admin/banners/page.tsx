import { requireStaff } from '@/lib/admin-auth';
import { CrudTable } from '@/components/admin/crud';

export const metadata = { title: 'Баннеры' };

export default async function BannersPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from('banners').select('*').order('sort');
  return (
    <CrudTable
      table="banners"
      title="Баннеры на главной"
      addLabel="Новый баннер"
      rows={data ?? []}
      defaults={{
        title_ru: '',
        title_uz: '',
        title_en: '',
        subtitle_ru: '',
        subtitle_uz: '',
        subtitle_en: '',
        image: null,
        link: '/catalog',
        sort: 0,
        is_active: true,
      }}
      columns={[
        { key: 'image', label: 'Фото', kind: 'image' },
        { key: 'title_ru', label: 'Заголовок' },
        { key: 'link', label: 'Ссылка', className: 'font-mono text-xs text-muted' },
        { key: 'sort', label: 'Порядок' },
        { key: 'is_active', label: 'Активен', kind: 'bool' },
      ]}
      fields={[
        { name: 'image', label: 'Изображение (горизонтальное, ~1800×800)', type: 'image', folder: 'banners' },
        { name: 'title_ru', label: 'Заголовок (RU)', type: 'text', required: true },
        { name: 'title_uz', label: 'Sarlavha (UZ)', type: 'text', half: true },
        { name: 'title_en', label: 'Title (EN)', type: 'text', half: true },
        { name: 'subtitle_ru', label: 'Подзаголовок (RU)', type: 'text' },
        { name: 'subtitle_uz', label: 'Tavsif (UZ)', type: 'text', half: true },
        { name: 'subtitle_en', label: 'Subtitle (EN)', type: 'text', half: true },
        { name: 'link', label: 'Ссылка кнопки (например /catalog?category=divany)', type: 'text', half: true },
        { name: 'sort', label: 'Порядок', type: 'number', half: true },
        { name: 'is_active', label: 'Показывать', type: 'checkbox' },
      ]}
    />
  );
}
