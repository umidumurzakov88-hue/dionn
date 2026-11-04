'use client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './toast';
import { ScrollReveal } from './scroll-reveal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
      <Toaster />
      <ScrollReveal />
    </ThemeProvider>
  );
}
