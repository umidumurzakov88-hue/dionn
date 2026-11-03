'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ProductGallery({ images, alt, activeImage }: { images: string[]; alt: string; activeImage?: string | null }) {
  const list = activeImage && !images.includes(activeImage) ? [activeImage, ...images] : images;
  const [idx, setIdx] = useState(0);
  const [lastActive, setLastActive] = useState(activeImage);
  // Jump to the variant's image when the customer picks another variant.
  if (activeImage !== lastActive) {
    setLastActive(activeImage);
    if (activeImage) setIdx(Math.max(0, list.indexOf(activeImage)));
  }
  const cur = list[idx] ?? list[0];
  const n = list.length;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {n > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto sm:max-h-[560px] sm:w-20 sm:flex-col sm:overflow-y-auto">
          {list.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setIdx(i)}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 sm:w-full ${i === idx ? 'border-fg' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="group relative aspect-square flex-1 overflow-hidden rounded-3xl bg-surface-2">
        {cur && <Image src={cur} alt={alt} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />}
        {n > 1 && (
          <>
            <button
              onClick={() => setIdx((idx - 1 + n) % n)}
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-surface/90 opacity-0 shadow transition group-hover:opacity-100"
              aria-label="prev"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => setIdx((idx + 1) % n)}
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-surface/90 opacity-0 shadow transition group-hover:opacity-100"
              aria-label="next"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
