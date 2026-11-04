import type { Metadata } from 'next';
import Link from 'next/link';
import '../globals.css';
import { manrope } from '../fonts';
import { Providers } from '@/components/ui/providers';
import { AdminShell, type ShellCounts } from '@/components/admin/shell';
import { getStaff } from '@/lib/admin-auth';
import { getAdminT } from '@/lib/admin-i18n';
import { AdminI18nProvider } from '@/i18n/admin/provider';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT();
  return {
    title: { default: t.common.adminPanel, template: '%s — Dionn Admin' },
    robots: { index: false, follow: false },
    icons: { icon: '/brand/icon.png' },
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [staff, { t, locale }] = await Promise.all([getStaff(), getAdminT()]);

  let body: React.ReactNode;
  if (!staff) {
    body = (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="card max-w-md p-8">
          <h1 className="text-2xl font-bold">{t.common.noAccess}</h1>
          <p className="mt-2 text-muted">
            {t.common.noAccessText}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/ru/login?next=/admin" className="btn-primary">
              {t.common.signIn}
            </Link>
            <Link href="/ru" className="btn-outline">
              {t.common.toSite}
            </Link>
          </div>
        </div>
      </div>
    );
  } else {
    const { data } = await staff.supabase.rpc('admin_stats');
    const counts: ShellCounts = {
      orders_new: data?.orders_new ?? 0,
      callbacks_open: data?.callbacks_open ?? 0,
      reviews_pending: data?.reviews_pending ?? 0,
    };
    body = (
      <AdminShell
        counts={counts}
        user={{ email: staff.user.email ?? '', name: staff.profile.full_name ?? '', role: staff.profile.role }}
      >
        {children}
      </AdminShell>
    );
  }

  return (
    <html lang={locale} suppressHydrationWarning className={manrope.variable}>
      <body>
        <Providers>
          <AdminI18nProvider locale={locale}>{body}</AdminI18nProvider>
        </Providers>
      </body>
    </html>
  );
}
