import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    // Collect cookies set by Supabase so we can attach them to the redirect response.
    // We cannot use createClient() here because that writes to next/headers cookies(),
    // which are NOT carried over when we return NextResponse.redirect().
    const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(c => pendingCookies.push(c))
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        let redirectTo = `${origin}/login?error=auth`

        if (user.email === 'mrjeffoliver@gmail.com') {
          redirectTo = `${origin}/admin`
        } else {
          const { data: client } = await supabase
            .from('clients')
            .select('portal_slug')
            .eq('email', user.email)
            .single()
          if (client?.portal_slug) {
            redirectTo = `${origin}/portal/${client.portal_slug}`
          }
        }

        const response = NextResponse.redirect(redirectTo)
        pendingCookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
        })
        return response
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
