import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isRoute =
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/markup') &&
    !request.nextUrl.pathname.startsWith('/google/markup');

  const devDefault: string = 'google';

  console.log('middleware', {
    isRoute,
    hostname: request.nextUrl.hostname,
    host: request.nextUrl.host,
  });

  const isGooglePhotos =
    isRoute &&
    (request.nextUrl.hostname === 'trmnl-google-photos.westling.dev' ||
      devDefault === 'google');
  const isApplePhotos =
    isRoute &&
    (request.nextUrl.hostname === 'trmnl-apple-photos.westling.dev' ||
      devDefault === 'apple');

  if (isGooglePhotos) {
    console.log('rewriting to google', request.nextUrl.pathname);
    return NextResponse.rewrite(
      new URL(
        `/google${request.nextUrl.pathname}${request.nextUrl.search}`,
        request.url
      )
    );
  }

  if (isApplePhotos) {
    console.log('rewriting to apple', request.nextUrl.pathname);
    return NextResponse.rewrite(
      new URL(
        `/apple${request.nextUrl.pathname}${request.nextUrl.search}`,
        request.url
      )
    );
  }

  console.log('not rewriting', request.nextUrl.pathname);
  return NextResponse.next();
}
