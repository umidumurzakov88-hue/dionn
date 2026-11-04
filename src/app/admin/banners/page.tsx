import { requireStaff } from '@/lib/admin-auth';
import { getAdminT } from '@/lib/admin-i18n';
import { CrudTable } from '@/components/admin/crud';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.catalog.banners.title };
}

export default async function BannersPage() {
  const { supabase } = await requireStaff();
  const { t } = await getAdminT();
  const L = t.catalog.banners;
  const { data } = await supabase.from('banners').select('*').order('sort');
  return (
    <CrudTable
      table="banners"
      title={L.heading}
      addLabel={L.add}
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
        { key: 'image', label: L.colPhoto, kind: 'image' },
        { key: 'title_ru', label: L.colTitle },
        { key: 'link', label: L.colLink, className: 'font-mono text-xs text-muted' },
        { key: 'sort', label: L.colSort },
        { key: 'is_active', label: L.colActive, kind: 'bool' },
      ]}
      fields={[
        { name: 'image', label: L.image, type: 'image', folder: 'banners' },
        { name: 'title_ru', label: L.titleRu, type: 'text', required: true },
        { name: 'title_uz', label: L.titleUz, type: 'text', half: true },
        { name: 'title_en', label: L.titleEn, type: 'text', half: true },
        { name: 'subtitle_ru', label: L.subtitleRu, type: 'text' },
        { name: 'subtitle_uz', label: L.subtitleUz, type: 'text', half: true },
        { name: 'subtitle_en', label: L.subtitleEn, type: 'text', half: true },
        { name: 'link', label: L.link, type: 'text', half: true },
        { name: 'sort', label: L.sort, type: 'number', half: true },
        { name: 'is_active', label: L.show, type: 'checkbox' },
      ]}
    />
  );
}
