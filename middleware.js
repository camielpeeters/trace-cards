export const runtime = "nodejs";

import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Protect /install route - redirect if already installed
  // Use environment variable instead of filesystem check
  if (pathname === '/install' || pathname.startsWith('/install/')) {
    if (process.env.APP_INSTALLED === 'true') {
      // Already installed, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Redirect /admin to /account/admin (the actual admin page)
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/account/admin', request.url));
  }
  
  // Redirect /admin/login to /admin/login (keep existing route)
  // Redirect /admin/users to /admin/users (keep existing route)
  // All other /admin/* paths should go to account/admin
  if (pathname.startsWith('/admin/') && pathname !== '/admin/login' && pathname !== '/admin/users') {
    return NextResponse.redirect(new URL('/account/admin', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/install/:path*',
  ],
};
