import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** True when the request carries a Supabase auth cookie (sb-<ref>-auth-token[.N]). */
export function hasAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
}

/** Refreshes the Supabase auth session cookie on every request. */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  // getClaims() refreshes an expired session and, with asymmetric signing keys, verifies
  // the JWT locally instead of calling the Auth server on every request.
  const { data } = await supabase.auth.getClaims();
  return { response, user: data?.claims?.sub ? { id: data.claims.sub } : null };
}
