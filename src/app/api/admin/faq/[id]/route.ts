import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const updates: { content?: string; subtitle?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  }
  if (typeof body.content === 'string') updates.content = body.content
  if (typeof body.subtitle === 'string') updates.subtitle = body.subtitle

  if (updates.content === undefined && updates.subtitle === undefined) {
    return NextResponse.json({ error: 'content or subtitle required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('faq_blocks')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
