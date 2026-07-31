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

  const VALID_AUDIENCES = ['bg', 'bb', 'gg']

  const body = await request.json()
  const updates: { content?: string; subtitle?: string; audiences?: string[]; updated_at: string } = {
    updated_at: new Date().toISOString(),
  }
  if (typeof body.content === 'string') updates.content = body.content
  if (typeof body.subtitle === 'string') updates.subtitle = body.subtitle
  if (Array.isArray(body.audiences)) {
    // Reject unknown values rather than storing them — a typo here would
    // silently hide a block from couples it was meant for.
    const cleaned = body.audiences.filter((a: unknown): a is string =>
      typeof a === 'string' && VALID_AUDIENCES.includes(a))
    if (cleaned.length !== body.audiences.length) {
      return NextResponse.json({ error: 'audiences must be any of bg, bb, gg' }, { status: 400 })
    }
    updates.audiences = cleaned
  }

  if (updates.content === undefined && updates.subtitle === undefined && updates.audiences === undefined) {
    return NextResponse.json({ error: 'content, subtitle or audiences required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('faq_blocks')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
