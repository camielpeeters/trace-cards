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
  
  // Redirect /admin to /admin (which will be handled by [username] route)
  // Actually, we want /admin to work as a username, so we don't need to redirect
  // The [username] route should handle it
  
  // Redirect /admin/shop to /admin/shop (handled by [username]/shop)
  if (pathname === '/admin' || pathname === '/admin/') {
    // Let it pass through to [username] route
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/install/:path*',
  ],
};
