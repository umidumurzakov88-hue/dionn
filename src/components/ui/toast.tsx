'use client';
import { create } from 'zustand';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ToastItem {
  id: number;
  text: string;
  kind: 'ok' | 'error';
}
const useToasts = create<{ items: ToastItem[]; push: (t: Omit<ToastItem, 'id'>) => void }>((set) => ({
  items: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { ...t, id }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 2800);
  },
}));

export const toast = {
  ok: (text: string) => useToasts.getState().push({ text, kind: 'ok' }),
  error: (text: string) => useToasts.getState().push({ text, kind: 'error' }),
};

export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className="animate-fade-in pointer-events-auto flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-fg shadow-xl"
        >
          {t.kind === 'ok' ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-danger" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
