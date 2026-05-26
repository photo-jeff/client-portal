import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST { active: 'none' | 'final_meeting' | 'phone_call' }
// Mutually exclusive — enabling one always disables the other.

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { active } = await request.json() as { active: string }

  const updates =
    active === 'final_meeting' ? { final_meeting_enabled: true,  phone_call_enabled: false } :
    active === 'phone_call'    ? { final_meeting_enabled: false, phone_call_enabled: true  } :
    active === 'none'          ? { final_meeting_enabled: false, phone_call_enabled: false } :
    null

  if (!updates) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('clients').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
