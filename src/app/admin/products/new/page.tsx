import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { ProductForm } from '@/components/admin/product-form';
import { getAdminT } from '@/lib/admin-i18n';
import type { Category } from '@/lib/types';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.products.newTitle };
}

export default async function NewProductPage() {
  const [{ supabase }, { t }] = await Promise.all([requireStaff(), getAdminT()]);
  const { data } = await supabase.from('categories').select('*').order('sort');
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> {t.products.allProducts}
      </Link>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">{t.products.newTitle}</h1>
      <ProductForm categories={(data as Category[]) ?? []} />
    </>
  );
}
