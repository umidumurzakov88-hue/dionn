'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setUserRole } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';
import { useAdminT } from '@/i18n/admin/provider';
import { fmt } from '@/i18n/admin';

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { t } = useAdminT();
  const c = t.customers;
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value as 'customer' | 'manager' | 'admin';
        if (v !== 'customer' && !confirm(fmt(c.confirmRole, { role: v === 'admin' ? t.common.admin : t.common.manager }))) {
          e.target.value = role;
          return;
        }
        start(async () => {
          const r = await setUserRole(userId, v);
          if (r.ok) toast.ok(c.roleChanged);
          else {
            toast.error(r.error);
            e.target.value = role;
          }
          router.refresh();
        });
      }}
      className="input"
    >
      <option value="customer">{c.optCustomer}</option>
      <option value="manager">{c.optManager}</option>
      <option value="admin">{c.optAdmin}</option>
    </select>
  );
}
