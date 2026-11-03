'use client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
