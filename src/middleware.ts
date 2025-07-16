
import { NextResponse, type NextRequest } from 'next/server';

// All authentication logic has been removed.
// The middleware is no longer needed to protect routes.
// We will return a simple `NextResponse.next()` for all requests.

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
