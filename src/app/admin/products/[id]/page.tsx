import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { ProductForm } from '@/components/admin/product-form';
import { getAdminT } from '@/lib/admin-i18n';
import type { Category, Product } from '@/lib/types';

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t.products.editTitle };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ supabase }, { t }] = await Promise.all([requireStaff(), getAdminT()]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: p }, { data: cats }] = await Promise.all([
    supabase.from('products').select('*, product_variants(*)').eq('id', id).maybeSingle(),
    supabase.from('categories').select('*').order('sort'),
  ]);
  if (!p) notFound();
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> {t.products.allProducts}
      </Link>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">{(p as Product).name_ru}</h1>
      <ProductForm key={p.id} product={p as Product} categories={(cats as Category[]) ?? []} />
    </>
  );
}
