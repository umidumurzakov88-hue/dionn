import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireStaff } from '@/lib/admin-auth';
import { ProductForm } from '@/components/admin/product-form';
import type { Category } from '@/lib/types';

export const metadata = { title: 'Новый товар' };

export default async function NewProductPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from('categories').select('*').order('sort');
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Все товары
      </Link>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Новый товар</h1>
      <ProductForm categories={(data as Category[]) ?? []} />
    </>
  );
}
