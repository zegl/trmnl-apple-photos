import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {

    const isRoute = !request.nextUrl.pathname.startsWith('/_next') && !request.nextUrl.pathname.startsWith('/api')

    const isGooglePhotos = isRoute && (request.nextUrl.hostname === 'trmnl-google-photos.westling.dev')

    if (isGooglePhotos) {
        return NextResponse.rewrite(new URL('/google', request.url))
    }
}