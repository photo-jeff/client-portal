import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(c => pendingCookies.push(c))
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
  }

  let redirectTo = '/login?error=auth'
  if (data.user.email === 'mrjeffoliver@gmail.com') {
    redirectTo = '/admin'
  } else {
    const { data: client } = await supabase
      .from('clients')
      .select('portal_slug')
      .eq('email', data.user.email!)
      .single()
    if (client?.portal_slug) {
      redirectTo = `/portal/${client.portal_slug}`
    }
  }

  const response = NextResponse.json({ redirectTo })
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })
  return response
}
