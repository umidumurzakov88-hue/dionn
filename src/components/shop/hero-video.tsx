'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/provider';

/**
 * Home hero: a silent looping video that links to the custom-order page.
 * No controls — visitors can't pause, seek or open the video menu.
 */
export function HeroVideo() {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const play = () => {
      if (v.paused) v.play().catch(() => {});
    };
    // Resume if anything pauses it (keyboard media keys, OS controls, returning to the tab…)
    v.addEventListener('pause', play);
    document.addEventListener('visibilitychange', play);
    play();
    return () => {
      v.removeEventListener('pause', play);
      document.removeEventListener('visibilitychange', play);
    };
  }, []);

  return (
    <section className="container-x pt-4 sm:pt-6">
      <Link
        href={`/${locale}/custom-order`}
        aria-label={t.custom.nav}
        onContextMenu={(e) => e.preventDefault()}
        className="relative block h-56 overflow-hidden rounded-3xl bg-white sm:h-80 lg:h-[26rem]"
      >
        <video
          ref={ref}
          src={`/video/hero-${locale}.mp4`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none size-full select-none object-contain"
        />
      </Link>
    </section>
  );
}
