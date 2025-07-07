import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isRoute =
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/markup');

  const devDefault: string = 'apple';

  const isGooglePhotos =
    isRoute &&
    (request.nextUrl.hostname === 'trmnl-google-photos.westling.dev' ||
      devDefault === 'google');
  const isApplePhotos =
    isRoute &&
    (request.nextUrl.hostname === 'trmnl-apple-photos.westling.dev' ||
      devDefault === 'apple');

  if (isGooglePhotos) {
    return NextResponse.rewrite(
      new URL(
        `/google${request.nextUrl.pathname}${request.nextUrl.search}`,
        request.url
      )
    );
  }

  if (isApplePhotos) {
    return NextResponse.rewrite(
      new URL(
        `/apple${request.nextUrl.pathname}${request.nextUrl.search}`,
        request.url
      )
    );
  }

  return NextResponse.next();
}
