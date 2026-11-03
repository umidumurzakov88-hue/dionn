import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Send } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { uzs } from '@/components/admin/ui';
import { OrdersTable } from '@/components/admin/orders-table';
import { RoleSelect } from '@/components/admin/role-select';
import { formatDate } from '@/lib/format';
import type { Order, Profile } from '@/lib/types';

export const metadata = { title: 'Клиент' };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, profile: me } = await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: p }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('orders').select('*').eq('user_id', id).order('created_at', { ascending: false }),
  ]);
  const profile = p as Profile | null;
  if (!profile) notFound();
  const list = (orders as Order[]) ?? [];
  const spent = list.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + Number(o.total), 0);

  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Все клиенты
      </Link>
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="card h-fit space-y-4 p-6">
          <div className="grid size-16 place-items-center rounded-2xl bg-accent-soft text-2xl font-extrabold text-accent">
            {(profile.full_name || profile.email || '?').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold">{profile.full_name || 'Без имени'}</h1>
            <p className="text-sm text-muted">с {formatDate(profile.created_at, 'ru', false)}</p>
          </div>
          <ul className="space-y-2 text-sm">
            {profile.email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-muted" />
                <a href={`mailto:${profile.email}`} className="hover:text-accent">
                  {profile.email}
                </a>
              </li>
            )}
            {profile.phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-muted" />
                <a href={`tel:${profile.phone}`} className="hover:text-accent">
                  {profile.phone}
                </a>
              </li>
            )}
            <li className="flex items-center gap-2">
              <Send className="size-4 text-muted" /> {profile.telegram_chat_id ? 'Telegram подключён' : 'Telegram не подключён'}
            </li>
          </ul>
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted">Заказов</p>
              <p className="text-xl font-bold">{list.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Потратил</p>
              <p className="text-xl font-bold">{uzs(spent)}</p>
            </div>
          </div>
          {me.role === 'admin' && (
            <div className="border-t border-border pt-4">
              <label className="label">Роль</label>
              <RoleSelect userId={profile.id} role={profile.role} />
            </div>
          )}
        </aside>
        <section className="card overflow-hidden">
          <h2 className="p-5 font-bold">Заказы клиента</h2>
          <OrdersTable orders={list} />
        </section>
      </div>
    </>
  );
}
