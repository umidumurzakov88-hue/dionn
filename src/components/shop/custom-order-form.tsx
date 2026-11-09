'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, X } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { toast } from '@/components/ui/toast';
import { compressImage } from '@/lib/compress-image';

const MAX_PHOTOS = 5;

interface Photo {
  key: string;
  blob: Blob;
  url: string; // object URL for the preview
}

export function CustomOrderForm({ defaults }: { defaults: { name: string; phone: string } }) {
  const { t, locale } = useI18n();
  const c = t.custom;
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false); // compressing
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (list.some((f) => !f.type.startsWith('image/'))) {
      toast.error(c.errPhotoType);
      return;
    }
    setBusy(true);
    try {
      const added = await Promise.all(
        list.map(async (f) => {
          const blob = await compressImage(f).catch(() => f);
          return { key: `${Date.now()}-${Math.random()}`, blob, url: URL.createObjectURL(blob) };
        }),
      );
      setPhotos((p) => [...p, ...added].slice(0, MAX_PHOTOS));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removePhoto(key: string) {
    setPhotos((list) => {
      const p = list.find((x) => x.key === key);
      if (p) URL.revokeObjectURL(p.url);
      return list.filter((x) => x.key !== key);
    });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!photos.length) {
      toast.error(c.errPhotos);
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set('locale', locale);
    photos.forEach((p, i) => fd.append('photos', p.blob, `photo-${i + 1}.${p.blob.type === 'image/webp' ? 'webp' : 'jpg'}`));
    setSending(true);
    const res = await fetch('/api/custom-orders', { method: 'POST', body: fd }).catch(() => null);
    setSending(false);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setSent(data.number ?? 0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const err = data.error as string | undefined;
    toast.error(
      err === 'phone'
        ? t.checkout.invalidPhone
        : err === 'photos'
          ? c.errPhotos
          : err === 'photoType'
            ? c.errPhotoType
            : err === 'tooMany'
              ? c.errTooMany
              : t.common.error,
    );
  }

  if (sent !== null) {
    return (
      <div className="card animate-scale-in p-8 text-center sm:p-12">
        <CheckCircle2 className="mx-auto size-14 text-success" />
        <h2 className="mt-4 text-2xl font-bold">{c.sentTitle.replace('{n}', String(sent))}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">{c.sentText}</p>
        <Link href={`/${locale}/account`} className="btn-primary mt-6">
          {c.toAccount}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5 sm:p-8">
      <div>
        <p className="mb-1 font-semibold">{c.photos}</p>
        <p className="mb-3 text-sm text-muted">{c.photosHint.replace('{n}', String(MAX_PHOTOS))}</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((p) => (
            <div key={p.key} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={p.url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(p.key)}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                aria-label={t.common.delete}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border text-muted transition hover:border-fg hover:text-fg"
            >
              <span className="flex flex-col items-center gap-1.5 text-xs font-medium">
                {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
                {c.addPhoto}
              </span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </div>

      <label className="block">
        <span className="mb-1.5 block font-semibold">{c.description}</span>
        <textarea name="description" required rows={4} maxLength={3000} placeholder={c.descriptionPh} className="input" />
      </label>

      <label className="block">
        <span className="mb-1.5 block font-semibold">{c.dimensions}</span>
        <input name="dimensions" maxLength={300} placeholder={c.dimensionsPh} className="input" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block font-semibold">{c.name}</span>
          <input name="name" required defaultValue={defaults.name} maxLength={120} className="input" />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-semibold">{c.phone}</span>
          <input name="phone" required type="tel" defaultValue={defaults.phone} placeholder="+998 __ ___ __ __" className="input" />
        </label>
      </div>

      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />

      <button disabled={sending || busy} className="btn-primary w-full sm:w-auto">
        {sending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> {c.sending}
          </>
        ) : (
          c.send
        )}
      </button>
    </form>
  );
}
