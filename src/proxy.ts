import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const isRoute =
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/markup') &&
    !request.nextUrl.pathname.startsWith('/google/markup') &&
    !request.nextUrl.pathname.startsWith('/apple/markup');

  const devDefault: string = 'apple';

  const isGoogleHost =
    request.nextUrl.hostname === 'trmnl-google-photos.westling.dev';
  const isAppleHost =
    request.nextUrl.hostname === 'trmnl-apple-photos.westling.dev';
  const isAnyHost = isGoogleHost || isAppleHost;

  const fallbackToGoogle = !isAnyHost && devDefault === 'google';
  const fallbackToApple = !isAnyHost && devDefault === 'apple';

  const isGooglePhotosRoute = isRoute && (isGoogleHost || fallbackToGoogle);
  const isApplePhotosRoute = isRoute && (isAppleHost || fallbackToApple);

  if (isGooglePhotosRoute) {
    return NextResponse.rewrite(
      new URL(
        `/google${request.nextUrl.pathname}${request.nextUrl.search}`,
        request.url
      )
    );
  }

  if (isApplePhotosRoute) {
    return NextResponse.rewrite(
      new URL(
        `/apple${request.nextUrl.pathname}${request.nextUrl.search}`,
        request.url
      )
    );
  }

  return NextResponse.next();
}
