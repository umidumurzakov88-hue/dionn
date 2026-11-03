import { requireStaff } from '@/lib/admin-auth';
import { CrudTable } from '@/components/admin/crud';
import { uzs } from '@/components/admin/ui';
import { formatDate } from '@/lib/format';
import type { PromoCode } from '@/lib/types';

export const metadata = { title: 'Промокоды' };

export default async function PromoPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
  const rows = (data as PromoCode[]) ?? [];
  const display = Object.fromEntries(
    rows.map((p) => [
      p.code,
      {
        value: p.type === 'percent' ? `${Number(p.value)}%` : uzs(p.value),
        min_total: Number(p.min_total) ? uzs(p.min_total) : '—',
        used: `${p.used_count}${p.max_uses != null ? ` / ${p.max_uses}` : ''}`,
        expires_at: p.expires_at ? formatDate(p.expires_at, 'ru', false) : 'бессрочно',
      },
    ]),
  );
  return (
    <CrudTable
      table="promo_codes"
      keyField="code"
      title="Промокоды"
      addLabel="Новый промокод"
      rows={rows as unknown as Record<string, unknown>[]}
      display={display}
      defaults={{ code: '', type: 'percent', value: 10, min_total: 0, max_uses: null, expires_at: null, is_active: true }}
      columns={[
        { key: 'code', label: 'Код', className: 'font-mono font-bold' },
        { key: 'value', label: 'Скидка' },
        { key: 'min_total', label: 'Мин. сумма' },
        { key: 'used', label: 'Использован' },
        { key: 'expires_at', label: 'До' },
        { key: 'is_active', label: 'Активен', kind: 'bool' },
      ]}
      fields={[
        {
          name: 'type',
          label: 'Тип скидки',
          type: 'select',
          half: true,
          options: [
            { value: 'percent', label: 'Процент (%)' },
            { value: 'fixed', label: 'Фиксированная (сум)' },
          ],
        },
        { name: 'value', label: 'Размер скидки', type: 'number', half: true, required: true },
        { name: 'min_total', label: 'Минимальная сумма заказа, сум', type: 'number', half: true },
        { name: 'max_uses', label: 'Лимит использований (пусто = без лимита)', type: 'number', half: true },
        { name: 'expires_at', label: 'Действует до', type: 'date', half: true },
        { name: 'is_active', label: 'Активен', type: 'checkbox', half: true },
      ]}
    />
  );
}
