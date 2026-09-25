import { NextResponse, type NextRequest } from 'next/server';
import { ROLE_HOME, SESSION_COOKIE, verifySessionToken, type Role } from './lib/session';

// Which role may open each protected section.
const PROTECTED: Array<{ prefix: string; role: Role }> = [
  { prefix: '/manager', role: 'manager' },
  { prefix: '/telecaller', role: 'telecaller' },
  { prefix: '/calling-executive', role: 'calling-executive' },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === '/login') {
    return user ? NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url)) : NextResponse.next();
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url));
  }

  const section = PROTECTED.find(s => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`));
  if (section && section.role !== user.role) {
    return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
};
