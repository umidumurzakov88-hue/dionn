'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/components/ui/toast';
import { deleteRow, saveRow } from '@/app/admin/actions';
import { ImagesInput } from './image-upload';

type Row = Record<string, unknown>;

export type Field =
  | { name: string; label: string; type: 'text' | 'number' | 'textarea' | 'date' | 'color'; required?: boolean; placeholder?: string; half?: boolean }
  | { name: string; label: string; type: 'checkbox'; half?: boolean }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[]; half?: boolean; required?: boolean }
  | { name: string; label: string; type: 'image'; folder: string };

export interface Column {
  key: string;
  label: string;
  kind?: 'image' | 'bool' | 'text';
  className?: string;
}

export function CrudTable({
  table,
  rows,
  fields,
  columns,
  defaults,
  keyField = 'id',
  title,
  addLabel = 'Добавить',
  display,
}: {
  table: 'categories' | 'banners' | 'promo_codes';
  rows: Row[];
  fields: Field[];
  columns: Column[];
  defaults: Row;
  keyField?: string;
  title: string;
  addLabel?: string;
  /** Pre-rendered display values: display[rowKey][columnKey] */
  display?: Record<string, Record<string, string>>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pending, start] = useTransition();

  const open = (row: Row | null) => {
    setIsNew(!row);
    setEditing(row ? { ...row } : { ...defaults });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    start(async () => {
      const payload: Row = {};
      for (const f of fields) payload[f.name] = editing[f.name];
      if (keyField === 'id' && editing.id) payload.id = editing.id;
      if (keyField !== 'id') {
        payload[keyField] = editing[keyField];
        if (!isNew) payload.__existing = true;
      }
      const r = await saveRow(table, payload, keyField);
      if (!r.ok) return toast.error(r.error);
      toast.ok('Сохранено');
      setEditing(null);
      router.refresh();
    });
  };

  const remove = (row: Row) => {
    if (!confirm('Удалить запись?')) return;
    start(async () => {
      const r = await deleteRow(table, String(row[keyField]), keyField);
      if (!r.ok) return toast.error(r.error);
      toast.ok('Удалено');
      router.refresh();
    });
  };

  const setField = (name: string, v: unknown) => setEditing((s) => (s ? { ...s, [name]: v } : s));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        <button onClick={() => open(null)} className="btn-primary h-10 py-0">
          <Plus className="size-4" /> {addLabel}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-surface-2/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={`px-5 py-3 ${c.className ?? ''}`}>
                    {c.label}
                  </th>
                ))}
                <th className="w-24 px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const k = String(row[keyField]);
                return (
                  <tr key={k} className="hover:bg-surface-2/60">
                    {columns.map((c) => {
                      const v = display?.[k]?.[c.key] ?? row[c.key];
                      return (
                        <td key={c.key} className={`px-5 py-3 ${c.className ?? ''}`}>
                          {c.kind === 'image' ? (
                            <span className="relative block h-12 w-16 overflow-hidden rounded-lg bg-surface-2">
                              {typeof v === 'string' && v && <Image src={v} alt="" fill sizes="64px" className="object-cover" />}
                            </span>
                          ) : c.kind === 'bool' ? (
                            <span className={`chip ${v ? 'bg-success/15 text-success' : 'bg-surface-2 text-muted'}`}>{v ? 'Да' : 'Нет'}</span>
                          ) : (
                            <span>{v == null || v === '' ? '—' : String(v)}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => open(row)} className="rounded-lg p-2 hover:bg-surface-2" aria-label="edit">
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => remove(row)} disabled={pending} className="rounded-lg p-2 text-danger hover:bg-surface-2" aria-label="delete">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-12 text-center text-muted">
                    Пока пусто
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? addLabel : 'Редактирование'} wide>
        {editing && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {keyField !== 'id' && (
              <div className="sm:col-span-2">
                <label className="label">Код *</label>
                <input
                  value={String(editing[keyField] ?? '')}
                  disabled={!isNew}
                  onChange={(e) => setField(keyField, e.target.value.toUpperCase())}
                  required
                  className="input font-mono uppercase"
                />
              </div>
            )}
            {fields.map((f) => {
              const v = editing[f.name];
              const span = 'half' in f && f.half ? '' : 'sm:col-span-2';
              if (f.type === 'checkbox')
                return (
                  <label key={f.name} className={`flex cursor-pointer items-center gap-3 text-sm ${span}`}>
                    <input type="checkbox" checked={!!v} onChange={(e) => setField(f.name, e.target.checked)} className="size-4 accent-[var(--accent)]" />
                    {f.label}
                  </label>
                );
              if (f.type === 'image')
                return (
                  <div key={f.name} className="sm:col-span-2">
                    <label className="label">{f.label}</label>
                    <div className="max-w-xs">
                      <ImagesInput value={v ? [String(v)] : []} onChange={(arr) => setField(f.name, arr[0] ?? null)} folder={f.folder} multiple={false} />
                    </div>
                  </div>
                );
              if (f.type === 'select')
                return (
                  <div key={f.name} className={span}>
                    <label className="label">{f.label}</label>
                    <select value={String(v ?? '')} onChange={(e) => setField(f.name, e.target.value || null)} required={f.required} className="input">
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              if (f.type === 'textarea')
                return (
                  <div key={f.name} className={span}>
                    <label className="label">{f.label}</label>
                    <textarea value={String(v ?? '')} onChange={(e) => setField(f.name, e.target.value)} rows={3} className="input" />
                  </div>
                );
              return (
                <div key={f.name} className={span}>
                  <label className="label">
                    {f.label}
                    {f.required && ' *'}
                  </label>
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'color' ? 'color' : 'text'}
                    step={f.type === 'number' ? 'any' : undefined}
                    value={f.type === 'date' && v ? String(v).slice(0, 10) : String(v ?? '')}
                    placeholder={f.placeholder}
                    required={f.required}
                    onChange={(e) => setField(f.name, f.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
                    className="input"
                  />
                </div>
              );
            })}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">
                Отмена
              </button>
              <button disabled={pending} className="btn-primary">
                {pending ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
