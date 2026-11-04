'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { tr, type Banner } from '@/lib/types';

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const { t, locale } = useI18n();
  const [i, setI] = useState(0);
  const n = banners.length;

  useEffect(() => {
    if (n < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % n), 6000);
    return () => clearInterval(id);
  }, [n]);

  if (!n) return null;
  return (
    <section className="container-x pt-4 sm:pt-6">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-2 sm:aspect-[21/9]">
        {banners.map((b, idx) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <Image src={b.image} alt="" fill priority={idx === 0} sizes="(max-width: 1280px) 100vw, 1280px" className={`object-cover ${idx === i ? "animate-ken-burns" : ""}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent sm:bg-gradient-to-r sm:from-black/65 sm:via-black/25" />
            <div className={`${idx === i ? "animate-stagger" : "opacity-0"} absolute inset-x-0 bottom-0 p-6 text-white sm:inset-y-0 sm:left-0 sm:right-auto sm:flex sm:max-w-xl sm:flex-col sm:justify-center sm:p-14`}>
              <h2 style={{ '--i': 0 } as React.CSSProperties} className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{tr(b, 'title', locale)}</h2>
              {tr(b, 'subtitle', locale) && <p style={{ '--i': 1 } as React.CSSProperties} className="mt-3 text-base text-white/85 sm:text-lg">{tr(b, 'subtitle', locale)}</p>}
              <Link
                href={b.link ? `/${locale}${b.link}` : `/${locale}/catalog`}
                style={{ '--i': 2 } as React.CSSProperties}
                className="group/cta btn mt-6 w-fit bg-white text-black hover:bg-white/90"
              >
                {t.home.heroCta} <ArrowRight className="size-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
              </Link>
            </div>
          </div>
        ))}
        {n > 1 && (
          <>
            <div className="absolute bottom-5 right-5 hidden gap-2 sm:flex">
              <button
                onClick={() => setI((i - 1 + n) % n)}
                className="grid size-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:scale-110 hover:bg-white/35 active:scale-95"
                aria-label="prev"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => setI((i + 1) % n)}
                className="grid size-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:scale-110 hover:bg-white/35 active:scale-95"
                aria-label="next"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
            <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-1.5 sm:bottom-6 sm:top-auto">
              {banners.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => setI(idx)}
                  aria-label={`slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === i ? 'w-8 bg-white' : 'w-3 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
