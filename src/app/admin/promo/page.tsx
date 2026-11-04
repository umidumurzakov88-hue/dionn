import { requireStaff } from '@/lib/admin-auth';
import { CrudTable } from '@/components/admin/crud';
import { getAdminT } from '@/lib/admin-i18n';
import { uzsL } from '@/i18n/admin';
import { formatDate } from '@/lib/format';
import type { PromoCode } from '@/lib/types';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.catalog.promo.title };
}

export default async function PromoPage() {
  const { supabase } = await requireStaff();
  const { t, locale } = await getAdminT();
  const L = t.catalog.promo;
  const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
  const rows = (data as PromoCode[]) ?? [];
  const display = Object.fromEntries(
    rows.map((p) => [
      p.code,
      {
        value: p.type === 'percent' ? `${Number(p.value)}%` : uzsL(p.value, locale),
        min_total: Number(p.min_total) ? uzsL(p.min_total, locale) : '—',
        used: `${p.used_count}${p.max_uses != null ? ` / ${p.max_uses}` : ''}`,
        expires_at: p.expires_at ? formatDate(p.expires_at, locale, false) : L.noExpiry,
      },
    ]),
  );
  return (
    <CrudTable
      table="promo_codes"
      keyField="code"
      title={L.title}
      addLabel={L.add}
      rows={rows as unknown as Record<string, unknown>[]}
      display={display}
      defaults={{ code: '', type: 'percent', value: 10, min_total: 0, max_uses: null, expires_at: null, is_active: true }}
      columns={[
        { key: 'code', label: L.colCode, className: 'font-mono font-bold' },
        { key: 'value', label: L.colValue },
        { key: 'min_total', label: L.colMinTotal },
        { key: 'used', label: L.colUsed },
        { key: 'expires_at', label: L.colExpires },
        { key: 'is_active', label: L.colActive, kind: 'bool' },
      ]}
      fields={[
        {
          name: 'type',
          label: L.type,
          type: 'select',
          half: true,
          options: [
            { value: 'percent', label: L.typePercent },
            { value: 'fixed', label: L.typeFixed },
          ],
        },
        { name: 'value', label: L.value, type: 'number', half: true, required: true },
        { name: 'min_total', label: L.minTotal, type: 'number', half: true },
        { name: 'max_uses', label: L.maxUses, type: 'number', half: true },
        { name: 'expires_at', label: L.expiresAt, type: 'date', half: true },
        { name: 'is_active', label: L.active, type: 'checkbox', half: true },
      ]}
    />
  );
}
