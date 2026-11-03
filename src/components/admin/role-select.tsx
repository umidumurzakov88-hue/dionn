'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setUserRole } from '@/app/admin/actions';
import { toast } from '@/components/ui/toast';

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value as 'customer' | 'manager' | 'admin';
        if (v !== 'customer' && !confirm(`Дать пользователю права «${v === 'admin' ? 'Администратор' : 'Менеджер'}»?`)) {
          e.target.value = role;
          return;
        }
        start(async () => {
          const r = await setUserRole(userId, v);
          if (r.ok) toast.ok('Роль изменена');
          else {
            toast.error(r.error);
            e.target.value = role;
          }
          router.refresh();
        });
      }}
      className="input"
    >
      <option value="customer">Клиент</option>
      <option value="manager">Менеджер (заказы, товары)</option>
      <option value="admin">Администратор (полный доступ)</option>
    </select>
  );
}
