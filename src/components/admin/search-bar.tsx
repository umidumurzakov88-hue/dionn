'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAdminT } from '@/i18n/admin/provider';

/** URL-driven search input for admin lists (?q=). */
export function SearchBar({ placeholder }: { placeholder?: string }) {
  const { t } = useAdminT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const p = new URLSearchParams(params);
        if (q.trim()) p.set('q', q.trim());
        else p.delete('q');
        p.delete('page');
        router.push(`${pathname}?${p}`);
      }}
      className="relative w-full sm:w-80"
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder ?? t.settings.search.placeholder} aria-label={t.common.search} className="input h-10 py-0 pl-10" />
    </form>
  );
}

export function Pagination({ page, pages }: { page: number; pages: number }) {
  const { t } = useAdminT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  if (pages <= 1) return null;
  const go = (n: number) => {
    const p = new URLSearchParams(params);
    p.set('page', String(n));
    router.push(`${pathname}?${p}`);
  };
  return (
    <div className="flex items-center justify-center gap-2 p-4 text-sm">
      <button disabled={page <= 1} onClick={() => go(page - 1)} aria-label={t.settings.search.prevPage} className="btn-outline px-3 py-2">
        ←
      </button>
      <span className="px-2 text-muted">
        {page} / {pages}
      </span>
      <button disabled={page >= pages} onClick={() => go(page + 1)} aria-label={t.settings.search.nextPage} className="btn-outline px-3 py-2">
        →
      </button>
    </div>
  );
}
