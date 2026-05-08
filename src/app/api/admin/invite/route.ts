import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, slug } = await request.json()
  const admin = createAdminClient()

  const { error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/${slug}`,
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('clients').update({ invite_sent_at: new Date().toISOString() }).eq('email', email)

  return NextResponse.json({ ok: true })
}
