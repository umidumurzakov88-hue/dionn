import { NextResponse, type NextRequest } from 'next/server';
import { getProducts } from '@/lib/data';

/** Public: products by ids (used by favorites & comparison pages). */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') ?? '')
    .split(',')
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s))
    .slice(0, 50);
  return NextResponse.json(await getProducts({ ids }));
}
