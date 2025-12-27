import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Protect doctor routes
  // /inbox and /chat/[chatId] are doctor routes
  // /chat (without ID) is patient route and should not be protected
  const pathname = request.nextUrl.pathname;
  
  // Protect /inbox route
  if (pathname === '/inbox') {
    try {
      const session = await getSession();
      if (!session) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Protect /chat/[uuid] routes (doctor chat routes)
  // Don't protect /chat (patient route)
  if (pathname.startsWith('/chat/') && pathname !== '/chat') {
    // Check if it looks like a UUID (doctor chat route)
    const chatIdMatch = pathname.match(/^\/chat\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    if (chatIdMatch) {
      try {
        const session = await getSession();
        if (!session) {
          const loginUrl = new URL('/login', request.url);
          return NextResponse.redirect(loginUrl);
        }
      } catch (error) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/inbox', '/chat/:path*'],
};

