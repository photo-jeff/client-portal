import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Find the client's portal slug and redirect there
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: client } = await supabase
          .from('clients')
          .select('portal_slug')
          .eq('email', user.email)
          .single()
        if (client?.portal_slug) {
          return NextResponse.redirect(`${origin}/portal/${client.portal_slug}`)
        }
      }
      return NextResponse.redirect(`${origin}/portal`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
