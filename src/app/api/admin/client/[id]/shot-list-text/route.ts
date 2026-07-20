import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST { text: string }
// Amend or replace a client's saved shot list (e.g. after the final details
// meeting changes it). Deliberately does NOT re-push to VSCO — the portal
// wizard's save is the only path that submits there.

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { text } = await request.json() as { text: string }
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({ shot_list_text: text.trim() } as Record<string, unknown>)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
