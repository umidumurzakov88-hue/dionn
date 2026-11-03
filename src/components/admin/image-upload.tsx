'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';

/** Resizes to max 1600px and converts to WebP in the browser before upload. */
async function compress(file: File, max = 1600): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/webp', 0.85));
}

export async function uploadImage(file: File, folder: string): Promise<string | null> {
  const blob = await compress(file);
  const ext = blob.type === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const sb = createClient();
  const { error } = await sb.storage.from('media').upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) {
    toast.error(`Ошибка загрузки: ${error.message}`);
    return null;
  }
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

export function ImagesInput({ value, onChange, folder = 'products', multiple = true }: { value: string[]; onChange: (v: string[]) => void; folder?: string; multiple?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const u = await uploadImage(f, folder);
      if (u) urls.push(u);
    }
    setBusy(false);
    onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
    if (ref.current) ref.current.value = '';
  };

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {value.map((src, i) => (
          <div key={src + i} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2">
            <Image src={src} alt="" fill sizes="160px" className="object-cover" />
            {i === 0 && multiple && <span className="chip absolute left-1.5 top-1.5 bg-primary text-[10px] text-primary-fg">Главное</span>}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-0 transition group-hover:opacity-100">
              {multiple && (
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="grid size-7 place-items-center rounded-lg bg-surface/90">
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="grid size-7 place-items-center rounded-lg bg-surface/90">
                    <ArrowRight className="size-3.5" />
                  </button>
                </span>
              )}
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="grid size-7 place-items-center rounded-lg bg-danger text-white">
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {(multiple || !value.length) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => ref.current?.click()}
            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border text-muted transition hover:border-fg hover:text-fg"
          >
            {busy ? <Loader2 className="size-6 animate-spin" /> : <span className="flex flex-col items-center gap-1 text-xs"><ImagePlus className="size-6" />Загрузить</span>}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}
