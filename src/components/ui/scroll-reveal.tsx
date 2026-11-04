'use client';
import { useEffect } from 'react';

const SELECTOR = '[data-reveal]:not(.is-visible)';

/** Fades in every [data-reveal] element as it scrolls into view (also ones added later). */
export function ScrollReveal() {
  useEffect(() => {
    const show = (el: Element) => {
      el.classList.add('is-visible');
      io.unobserve(el);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && show(e.target)),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    // Safety net: anything already in or above the viewport is shown, even if an
    // intersection event was missed (fast scroll, anchor jump, throttled tab).
    const sweep = () => {
      const limit = window.innerHeight * 0.95;
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (el.getBoundingClientRect().top < limit) show(el);
      });
    };
    const scan = () => document.querySelectorAll(SELECTOR).forEach((el) => io.observe(el));

    let last = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const now = Date.now();
      clearTimeout(timer);
      if (now - last > 150) {
        last = now;
        sweep();
      }
      timer = setTimeout(sweep, 200); // trailing call after scrolling stops
    };

    scan();
    document.documentElement.classList.add('reveal-ready');
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return null;
}
