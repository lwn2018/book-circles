import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const url = req.nextUrl

  // Check for password recovery - redirect to update-password page
  // Supabase sends: ?token=xxx&type=recovery OR hash #access_token=xxx&type=recovery
  if (url.pathname === '/' && url.searchParams.get('type') === 'recovery') {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/auth/update-password'
    return NextResponse.redirect(redirectUrl)
  }

  // Password reset pages - ALWAYS allow, no auth check needed
  if (url.pathname.startsWith('/auth/reset-password') || 
      url.pathname.startsWith('/auth/update-password')) {
    return res
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ['/dashboard', '/circles', '/library', '/shelf', '/notifications', '/settings', '/admin', '/invite', '/handoff']
  const publicPaths = ['/circles/join']

  const isPublicPath = publicPaths.some(path => url.pathname.startsWith(path))
  const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))

  // Redirect to signin if accessing protected route without session
  if (isProtectedRoute && !session && !isPublicPath) {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/auth/signin'
    redirectUrl.searchParams.set('redirectTo', url.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect logged-in users away from auth pages (except password reset)
  if (session && url.pathname.startsWith('/auth/') && 
      !url.pathname.startsWith('/auth/reset-password') && 
      !url.pathname.startsWith('/auth/update-password')) {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/circles'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
