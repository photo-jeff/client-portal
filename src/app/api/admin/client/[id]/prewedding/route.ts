import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST { action: 'on' | 'off' | 'reset' }
//   on    — force-show the pre-wed section regardless of package
//   off   — force-hide the pre-wed section regardless of package
//   reset — clear the booking so the client can rebook (keeps override)

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { action } = await request.json() as { action: string }

  let updates: Record<string, unknown>
  if (action === 'on') {
    updates = { prewedding_override: 'on' }
  } else if (action === 'off') {
    updates = { prewedding_override: 'off' }
  } else if (action === 'reset') {
    updates = {
      prewedding_shoot_at: null,
      prewedding_reschedule_url: null,
      prewedding_override: null,
    }
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('clients').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
