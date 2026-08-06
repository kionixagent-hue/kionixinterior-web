import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { shouldRedirectToLogin } from './lib/auth/authGuard'
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/auth/session'

const intlMiddleware = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const userId = token ? await verifySessionToken(token, process.env.SESSION_SECRET!) : null

    if (shouldRedirectToLogin(request.nextUrl.pathname, !!userId)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // No saved preference yet: visitors from Indonesia get 'id' regardless of
  // browser Accept-Language, by feeding next-intl's negotiator that instead.
  // Deployed behind a Cloudflare Tunnel, so geo comes from the cf-ipcountry
  // header Cloudflare injects — not Vercel's request.geo (always empty here).
  const country = request.headers.get('cf-ipcountry')
  if (country === 'ID' && !request.cookies.has('NEXT_LOCALE')) {
    const headers = new Headers(request.headers)
    headers.set('accept-language', 'id')
    request = new NextRequest(request, { headers })
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
