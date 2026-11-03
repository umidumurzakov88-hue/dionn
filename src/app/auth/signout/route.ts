import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = req.cookies.get('NEXT_LOCALE')?.value ?? 'ru';
  return NextResponse.redirect(new URL(`/${locale}`, req.url), { status: 303 });
}
