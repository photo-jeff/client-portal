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
  const update: Record<string, string> = { updated_at: new Date().toISOString() }
  if (typeof body.question === 'string') update.question = body.question
  if (typeof body.answer   === 'string') update.answer   = body.answer

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: 'question or answer required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('prewed_faq')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
