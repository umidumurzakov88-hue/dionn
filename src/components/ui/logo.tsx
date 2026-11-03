import Image from 'next/image';
import Link from 'next/link';

export function Logo({ href = '/', className = 'h-9 w-auto' }: { href?: string; className?: string }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="Dionn — Art of Furniture">
      <Image src="/brand/logo.png" alt="Dionn — Art of Furniture" width={510} height={175} priority className={`logo-ink ${className}`} />
    </Link>
  );
}
