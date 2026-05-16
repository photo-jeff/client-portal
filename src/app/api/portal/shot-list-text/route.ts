import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { slug, text } = await request.json()
  if (!slug || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()

  const { error } = await admin
    .from('clients')
    .update({ shot_list_text: text } as Record<string, unknown>)
    .eq('portal_slug', slug)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
