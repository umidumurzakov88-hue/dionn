import Link from 'next/link';
import { getDict } from '@/i18n/config';

export default function NotFound() {
  const t = getDict('ru');
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <p className="text-8xl font-extrabold text-accent">404</p>
        <h1 className="mt-4 text-2xl font-bold">{t.notFound.title}</h1>
        <p className="mt-2 text-muted">{t.notFound.text}</p>
        <Link href="/" className="btn-primary mt-6">
          {t.notFound.home}
        </Link>
      </div>
    </div>
  );
}
