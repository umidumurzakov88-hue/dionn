import { NextResponse, type NextRequest } from 'next/server';
import { evaluatePromo } from '@/lib/promo';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const total = Number(req.nextUrl.searchParams.get('total') ?? 0);
  const res = await evaluatePromo(code, total);
  return NextResponse.json(res ? { valid: true, ...res } : { valid: false });
}
