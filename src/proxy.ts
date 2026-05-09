import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const DEV_PREVIEW = process.env.NEXT_PUBLIC_DEV_PREVIEW === 'true'
const SUPABASE_CONFIGURED = process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  // In dev preview mode, allow /preview/* without auth
  if (DEV_PREVIEW && pathname.startsWith('/preview')) {
    return response
  }

  // Skip auth enforcement if Supabase isn't configured yet
  if (!SUPABASE_CONFIGURED) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Only admin routes need auth — portal is slug-based (no login required)
  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from login
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|insurance|api/auth).*)'],
}
