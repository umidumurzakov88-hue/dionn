import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { ProductForm } from '@/components/admin/product-form';
import type { Category, Product } from '@/lib/types';

export const metadata = { title: 'Редактирование товара' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireStaff();
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
        <ArrowLeft className="size-4" /> Все товары
      </Link>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">{(p as Product).name_ru}</h1>
      <ProductForm key={p.id} product={p as Product} categories={(cats as Category[]) ?? []} />
    </>
  );
}
