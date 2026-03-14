import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Check for password recovery token in URL (Supabase redirects to root with token)
  const url = req.nextUrl
  if (url.pathname === '/' && (url.searchParams.has('token') || url.hash.includes('type=recovery'))) {
    // Redirect to update-password page with the token
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/auth/update-password'
    return NextResponse.redirect(redirectUrl)
  }

  // Also check for recovery type in hash (client-side tokens)
  if (url.pathname === '/' && url.searchParams.get('type') === 'recovery') {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/auth/update-password'
    return NextResponse.redirect(redirectUrl)
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

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/circles',
    '/library',
    '/shelf',
    '/notifications',
    '/settings',
    '/admin',
    '/invite',
    '/handoff',
  ]

  const publicPaths = [
    '/circles/join',
  ]

  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !session && !isPublicPath) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/signin'
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Password reset pages should always be accessible
  const passwordResetPaths = ['/auth/reset-password', '/auth/update-password']
  const isPasswordReset = passwordResetPaths.some(path => req.nextUrl.pathname === path)
  
  if (session && req.nextUrl.pathname.startsWith('/auth/') && !isPasswordReset) {
    const redirectUrl = req.nextUrl.clone()
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
