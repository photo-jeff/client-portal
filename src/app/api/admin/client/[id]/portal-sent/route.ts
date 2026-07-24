import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST { sent: boolean }
// Manually log whether Jeff has sent the portal link to the couple.
// Stores/clears the timestamp in clients.invite_sent_at.
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { sent } = await request.json() as { sent: boolean }
  const invite_sent_at = sent ? new Date().toISOString() : null

  const admin = createAdminClient()
  const { error } = await admin.from('clients').update({ invite_sent_at }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, invite_sent_at })
}
