import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';
import { defaultLocale, isLocale } from '@/i18n/config';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Admin area: must be signed in (the role itself is checked in the admin layout).
  if (pathname.startsWith('/admin')) {
    const { response, user } = await updateSession(request, NextResponse.next({ request }));
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${defaultLocale}/login`;
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (pathname.startsWith('/auth')) {
    return (await updateSession(request, NextResponse.next({ request }))).response;
  }

  // Storefront: every page lives under /ru, /uz or /en.
  const first = pathname.split('/')[1];
  if (!isLocale(first)) {
    const saved = request.cookies.get('NEXT_LOCALE')?.value;
    const locale = isLocale(saved) ? saved : defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  const { response } = await updateSession(request, NextResponse.next({ request }));
  if (request.cookies.get('NEXT_LOCALE')?.value !== first) {
    response.cookies.set('NEXT_LOCALE', first, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}

export const config = {
  // Skip API routes, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|brand|demo|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)'],
};
